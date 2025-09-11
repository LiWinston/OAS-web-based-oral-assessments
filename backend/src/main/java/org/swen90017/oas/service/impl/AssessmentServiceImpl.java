package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.ExaminerAssessmentsQueryDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.request.SubmitAssessmentRequestDTO;
import org.swen90017.oas.dto.response.AssessmentSubmissionDTO;
import org.swen90017.oas.dto.response.ExaminerSummaryDTO;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.service.AssessmentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentServiceImpl implements AssessmentService {

    private final AssessmentSubmissionMapper submissionMapper;
    private final AssignmentMapper assignmentMapper;
    private final SessionExaminerMapper sessionExaminerMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public AssessmentSubmissionDTO saveDraft(SaveAssessmentDraftRequestDTO request, Long examinerId) {
        // 1) 作业存在性
        Assignment assignment = assignmentMapper.selectById(request.getAssignmentId());
        if (assignment == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);

        // 2) 会话指派校验（如传 sessionId）
        if (request.getSessionId() != null) {
            List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(request.getSessionId());
            if (examiners == null || !examiners.contains(examinerId)) {
                throw new BusinessException(BusinessError.NOT_ASSIGNED_TO_SESSION);
            }
        }

        // 2.1 兼容 subjectType 同义词
        String normalizedSubjectType = normalizeSubjectType(request.getSubjectType());

        // 3) 查询是否已有草稿（唯一键）
        AssessmentSubmission existing = submissionMapper.selectByUniqueTarget(
                request.getAssignmentId(), request.getSessionId(), normalizedSubjectType, request.getSubjectId(), examinerId);

        boolean isCreate = (existing == null);
        AssessmentSubmission record = isCreate ? new AssessmentSubmission() : existing;
        if (isCreate) {
            record.setAssignmentId(request.getAssignmentId());
            record.setSessionId(request.getSessionId());
            record.setSubjectType(normalizedSubjectType);
            record.setSubjectId(request.getSubjectId());
            record.setExaminerId(examinerId);
            record.setStatus("DRAFT");
            record.setCreatedAt(LocalDateTime.now());
            record.setUpdatedAt(LocalDateTime.now());
            record.setVersion(record.getVersion() == null ? 0 : record.getVersion());
        }

        // 4) 生成/维持 Rubric 快照
        if (isCreate || record.getRubricMetaSnapshot() == null) {
            record.setRubricMetaSnapshot(assignment.getRubricMetaInfo());
        }
        if (isCreate || record.getRubricsInfoSnapshot() == null) {
            record.setRubricsInfoSnapshot(assignment.getRubricsInfo());
        }

        // 5) 校验 scores，并计算总分（草稿可不完整，此处允许部分为空）
        String normalizedScoresJson = normalizeAndValidateScores(record.getRubricsInfoSnapshot(), request);
        record.setScoresJson(normalizedScoresJson);
        Double total = computeTotalScore(record.getRubricsInfoSnapshot(), normalizedScoresJson);
        record.setTotalScore(total);

        // 6) 备注与反馈
        record.setOverallFeedback(request.getOverallFeedback());
        record.setAdminNote(request.getAdminNote());

        // 7) 保存
        if (isCreate) {
            submissionMapper.insert(record);
        } else {
            record.setUpdatedAt(LocalDateTime.now());
            submissionMapper.updateById(record);
        }

        return toDTO(record);
    }

    @Override
    @Transactional
    public AssessmentSubmissionDTO submit(SubmitAssessmentRequestDTO request, Long examinerId) {
        AssessmentSubmission target = resolveTargetSubmission(request, examinerId);
        if (!Objects.equals(target.getExaminerId(), examinerId)) {
            throw new BusinessException(SecurityError.INSUFFICIENT_PRIVILEGES);
        }
        if (!"DRAFT".equalsIgnoreCase(target.getStatus())) {
            throw new BusinessException(BusinessError.ASSESSMENT_ALREADY_SUBMITTED);
        }

        // 提交校验：需可计算总分（若有缺漏，按业务决定：这里允许缺项按 0 分对待）
        Double total = computeTotalScore(target.getRubricsInfoSnapshot(), target.getScoresJson());
        target.setTotalScore(total);
        target.setStatus("SUBMITTED");
        target.setSubmittedAt(LocalDateTime.now());
        target.setUpdatedAt(LocalDateTime.now());
        submissionMapper.updateById(target);
        return toDTO(target);
    }

    @Override
    public AssessmentSubmissionDTO getMySubmission(Long submissionId, Long examinerId) {
        AssessmentSubmission rec = submissionMapper.selectById(submissionId);
        if (rec == null) throw new BusinessException(BusinessError.INVALID_PARAM);
        if (!Objects.equals(rec.getExaminerId(), examinerId)) throw new BusinessException(SecurityError.INSUFFICIENT_PRIVILEGES);
        return toDTO(rec);
    }

    @Override
    public List<AssessmentSubmissionDTO> listMySubmissions(ExaminerAssessmentsQueryDTO query, Long examinerId) {
        LocalDateTime from = query.getFrom() == null ? null : query.getFrom().atStartOfDay();
        LocalDateTime to = query.getTo() == null ? null : query.getTo().atTime(23,59,59);
        List<AssessmentSubmission> list = submissionMapper.listByExaminer(examinerId, query.getAssignmentId(), query.getStatus(), from, to);
        List<AssessmentSubmissionDTO> resp = new ArrayList<>();
        for (AssessmentSubmission r : list) resp.add(toDTO(r));
        return resp;
    }

    @Override
    public ExaminerSummaryDTO getMySummary(ExaminerAssessmentsQueryDTO query, Long examinerId) {
        List<AssessmentSubmission> list = submissionMapper.listByExaminer(examinerId, query.getAssignmentId(), null, null, null);
        int draft = 0, submitted = 0;
        for (AssessmentSubmission r : list) {
            if ("SUBMITTED".equalsIgnoreCase(r.getStatus())) submitted++; else draft++;
        }
        ExaminerSummaryDTO dto = new ExaminerSummaryDTO();
        dto.setDraftCount(draft);
        dto.setSubmittedCount(submitted);
        dto.setByAssignment(null); // 简化：如需按作业聚合，可在 Mapper 加聚合 SQL
        return dto;
    }

    private AssessmentSubmissionDTO toDTO(AssessmentSubmission record) {
        AssessmentSubmissionDTO dto = new AssessmentSubmissionDTO();
        dto.setSubmissionId(record.getId());
        dto.setAssignmentId(record.getAssignmentId());
        dto.setSessionId(record.getSessionId());
        dto.setSubjectType(record.getSubjectType());
        dto.setSubjectId(record.getSubjectId());
        dto.setExaminerId(record.getExaminerId());
        dto.setStatus(record.getStatus());
        dto.setOverallFeedback(record.getOverallFeedback());
        dto.setTotalScore(record.getTotalScore());
        dto.setSubmittedAt(record.getSubmittedAt());
        dto.setUpdatedAt(record.getUpdatedAt());
        dto.setRubricMetaSnapshot(record.getRubricMetaSnapshot());
        dto.setRubricsInfoSnapshot(record.getRubricsInfoSnapshot());
        dto.setScoresJson(record.getScoresJson());
        return dto;
    }

    private AssessmentSubmission resolveTargetSubmission(SubmitAssessmentRequestDTO request, Long examinerId) {
        AssessmentSubmission target;
        if (request.getSubmissionId() != null) {
            target = submissionMapper.selectById(request.getSubmissionId());
        } else {
            target = submissionMapper.selectByUniqueTarget(request.getAssignmentId(), request.getSessionId(), normalizeSubjectType(request.getSubjectType()), request.getSubjectId(), examinerId);
        }
        if (target == null) throw new BusinessException(BusinessError.INVALID_PARAM);
        return target;
    }

    private String normalizeAndValidateScores(String rubricsInfoSnapshot, SaveAssessmentDraftRequestDTO request) {
        try {
            if (rubricsInfoSnapshot == null || rubricsInfoSnapshot.trim().isEmpty()) {
                throw new BusinessException(BusinessError.RUBRIC_INFO_EMPTY);
            }
            List<RubricsInfoDto> rubricItems = parseRubricItems(rubricsInfoSnapshot);
            if (rubricItems == null || rubricItems.isEmpty()) {
                throw new BusinessException(BusinessError.RUBRIC_ITEMS_EMPTY);
            }
            if (request.getScores() == null) return objectMapper.writeValueAsString(new ArrayList<>());
            for (SaveAssessmentDraftRequestDTO.ScoreItem s : request.getScores()) {
                RubricsInfoDto matched = rubricItems.stream()
                        .filter(it -> it.getDescription() != null && it.getDescription().trim().equalsIgnoreCase(s.getDescription() == null ? "" : s.getDescription().trim()))
                        .findFirst().orElse(null);
                if (matched == null) throw new BusinessException(BusinessError.RUBRIC_CRITERION_NOT_FOUND.getMessage() + ": " + s.getDescription(), BusinessError.RUBRIC_CRITERION_NOT_FOUND.getCode());

                // scaleType 合法性（支持 percentage 作为 points 同义）
                String reqType = s.getScaleType();
                String rubType = matched.getScaleType();
                if (reqType == null || rubType == null || !isScaleTypeCompatible(reqType, rubType)) {
                    throw new BusinessException(BusinessError.RUBRIC_MISMATCH);
                }

                if (isPointsLike(reqType)) {
                    if (s.getInputPoints() != null && (s.getInputPoints() < 0 || s.getInputPoints() > 100)) {
                        throw new BusinessException(BusinessError.SCORE_OUT_OF_RANGE);
                    }
                } else if ("descriptive".equalsIgnoreCase(reqType)) {
                    if (s.getSelectedLevel() != null) {
                        Double st = s.getSelectedLevel().getStartPoint();
                        Double ed = s.getSelectedLevel().getEndPoint();
                        if (st == null || ed == null || st < 0 || ed > 100 || st > ed) {
                            throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                        }
                    }
                }
            }
            return objectMapper.writeValueAsString(request.getScores());
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("Rubric parse/validation failed: {}", e.getMessage(), e);
            throw new BusinessException(BusinessError.RUBRIC_PARSE_ERROR.getMessage() + ": " + e.getMessage(), BusinessError.RUBRIC_PARSE_ERROR.getCode());
        }
    }

    private Double computeTotalScore(String rubricsInfoSnapshot, String scoresJson) {
        try {
            List<RubricsInfoDto> rubricItems = parseRubricItems(rubricsInfoSnapshot);
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});
            double total = 0.0;
            for (RubricsInfoDto r : rubricItems) {
                double weight = r.getWeight() == null ? 0.0 : r.getWeight();
                SaveAssessmentDraftRequestDTO.ScoreItem matched = scores.stream()
                        .filter(s -> r.getDescription() != null && r.getDescription().trim().equalsIgnoreCase(s.getDescription() == null ? "" : s.getDescription().trim()))
                        .findFirst().orElse(null);
                double normalized = 0.0;
                if (matched != null) {
                    String scale = r.getScaleType();
                    if (isPointsLike(scale)) {
                        Double p = matched.getInputPoints();
                        normalized = p == null ? 0.0 : Math.max(0.0, Math.min(100.0, p));
                    } else if ("descriptive".equalsIgnoreCase(scale)) {
                        if (matched.getSelectedLevel() != null) {
                            Double st = matched.getSelectedLevel().getStartPoint();
                            Double ed = matched.getSelectedLevel().getEndPoint();
                            if (st != null && ed != null) normalized = (st + ed) / 2.0;
                        }
                    }
                }
                total += normalized * weight / 100.0;
            }
            return total;
        } catch (Exception e) {
            log.warn("Failed to compute total score", e);
            return null;
        }
    }

    private List<RubricsInfoDto> parseRubricItems(String rubricsInfoSnapshot) throws Exception {
        return org.swen90017.oas.utils.RubricParser.parseRubricItems(objectMapper, rubricsInfoSnapshot);
    }

    private boolean isPointsLike(String scaleType) {
        return scaleType != null && (scaleType.equalsIgnoreCase("points") || scaleType.equalsIgnoreCase("percentage"));
    }

    private boolean isScaleTypeCompatible(String a, String b) {
        if (a == null || b == null) return false;
        if (isPointsLike(a) && isPointsLike(b)) return true;
        return a.equalsIgnoreCase(b);
    }

    private String normalizeSubjectType(String subjectType) {
        if (subjectType == null) return null;
        if (subjectType.equalsIgnoreCase("INDIVIDUAL") || subjectType.equalsIgnoreCase("STUDENT")) return "STUDENT";
        if (subjectType.equalsIgnoreCase("GROUP")) return "GROUP";
        return subjectType;
    }
}


