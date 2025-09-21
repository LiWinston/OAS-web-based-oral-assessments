package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.PerformanceDto;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.ExaminerAssessmentsQueryDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.request.SubmitAssessmentRequestDTO;
import org.swen90017.oas.dto.response.AssessmentSubmissionDTO;
import org.swen90017.oas.dto.response.ExaminerSummaryDTO;
import org.swen90017.oas.dto.response.ExaminerAssessmentsPageResponseDTO;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.SessionStudent;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.mapper.SessionStudentMapper;
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
    private final SessionStudentMapper sessionStudentMapper;
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

        // 2.2 查询 enrollment_id (如果提供了 sessionId)
        Long enrollmentId = null;
        if (request.getSessionId() != null) {
            SessionStudent enrollment = sessionStudentMapper.selectBySessionAndSubject(
                request.getSessionId(), normalizedSubjectType, request.getSubjectId());
            if (enrollment != null) {
                enrollmentId = enrollment.getId();
            }
        }

        // 3) 查询是否已有草稿（优先使用新方法）
        AssessmentSubmission existing = null;
        if (enrollmentId != null) {
            // 使用新的基于 enrollment_id 的查询方法
            existing = submissionMapper.selectByEnrollmentAndExaminer(enrollmentId, examinerId);
        } else {
            // 回退到旧的唯一键查询方法
            existing = submissionMapper.selectByUniqueTarget(
                    request.getAssignmentId(), request.getSessionId(), normalizedSubjectType, request.getSubjectId(), examinerId);
        }

        boolean isCreate = (existing == null);
        AssessmentSubmission record = isCreate ? new AssessmentSubmission() : existing;
        if (isCreate) {
            record.setAssignmentId(request.getAssignmentId());
            record.setSessionId(request.getSessionId());
            record.setEnrollmentId(enrollmentId); // 设置 enrollment_id
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
        // 若本次提交携带了评分/反馈内容，同步写入到记录再提交
        boolean needUpdateContent = request.getScores() != null || request.getOverallFeedback() != null || request.getAdminNote() != null;
        if (needUpdateContent) {
            // 使用 saveDraft 的校验与归一逻辑进行一次标准化
            SaveAssessmentDraftRequestDTO save = new SaveAssessmentDraftRequestDTO();
            save.setAssignmentId(target.getAssignmentId());
            save.setSessionId(target.getSessionId());
            save.setSubjectType(target.getSubjectType());
            save.setSubjectId(target.getSubjectId());
            save.setOverallFeedback(request.getOverallFeedback());
            save.setAdminNote(request.getAdminNote());
            save.setScores(request.getScores());
            AssessmentSubmissionDTO updated = saveDraft(save, examinerId);
            // 重新读取最新实体
            target = submissionMapper.selectById(updated.getSubmissionId());
        }
        if (!Objects.equals(target.getExaminerId(), examinerId)) {
            throw new BusinessException(SecurityError.INSUFFICIENT_PRIVILEGES);
        }
        if (!"DRAFT".equalsIgnoreCase(target.getStatus())) {
            throw new BusinessException(BusinessError.ASSESSMENT_ALREADY_SUBMITTED);
        }

        // 提交校验：需可计算总分；若有缺漏，直接报未完成（避免空项默认0分）
        ensureAllCriteriaCompleted(target.getRubricsInfoSnapshot(), target.getScoresJson());
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
        LocalDateTime from = query.getCreatedFrom() == null ? null : query.getCreatedFrom().atStartOfDay();
        LocalDateTime to = query.getCreatedTo() == null ? null : query.getCreatedTo().atTime(23,59,59);
        List<AssessmentSubmission> list = submissionMapper.listByExaminer(examinerId, query.getAssignmentId(), query.getStatus(), from, to);
        List<AssessmentSubmissionDTO> resp = new ArrayList<>();
        for (AssessmentSubmission r : list) resp.add(toDTO(r));
        return resp;
    }

    @Override
    public ExaminerAssessmentsPageResponseDTO pageMySubmissions(ExaminerAssessmentsQueryDTO query, Long examinerId) {
        int page = query.getPage() == null || query.getPage() < 1 ? 1 : query.getPage();
        int limit = query.getLimit() == null ? 20 : Math.min(Math.max(query.getLimit(), 1), 100);
        int offset = (page - 1) * limit;

        LocalDateTime createdFrom = query.getCreatedFrom() == null ? null : query.getCreatedFrom().atStartOfDay();
        LocalDateTime createdTo = query.getCreatedTo() == null ? null : query.getCreatedTo().atTime(23,59,59);
        LocalDateTime submittedFrom = query.getSubmittedFrom() == null ? null : query.getSubmittedFrom().atStartOfDay();
        LocalDateTime submittedTo = query.getSubmittedTo() == null ? null : query.getSubmittedTo().atTime(23,59,59);

        String sortBy = normalizeSortBy(query.getSortBy());
        String sortOrder = normalizeSortOrder(query.getSortOrder());

        List<AssessmentSubmission> rows = submissionMapper.pageByExaminer(
                examinerId,
                query.getAssignmentId(),
                query.getSessionId(),
                normalizeSubjectType(query.getSubjectType()),
                query.getSubjectId(),
                query.getStatus(),
                query.getStatuses(),
                createdFrom,
                createdTo,
                submittedFrom,
                submittedTo,
                query.getMinScore(),
                query.getMaxScore(),
                emptyToNull(query.getKeyword()),
                offset,
                limit,
                sortBy,
                sortOrder
        );
        Long total = submissionMapper.countByExaminer(
                examinerId,
                query.getAssignmentId(),
                query.getSessionId(),
                normalizeSubjectType(query.getSubjectType()),
                query.getSubjectId(),
                query.getStatus(),
                query.getStatuses(),
                createdFrom,
                createdTo,
                submittedFrom,
                submittedTo,
                query.getMinScore(),
                query.getMaxScore(),
                emptyToNull(query.getKeyword())
        );

        List<AssessmentSubmissionDTO> items = new ArrayList<>();
        for (AssessmentSubmission r : rows) items.add(toDTO(r));

        org.swen90017.oas.dto.response.PaginationDTO p = new org.swen90017.oas.dto.response.PaginationDTO();
        p.setCurrentPage(page);
        p.setItemsPerPage(limit);
        p.setTotalItems(total == null ? 0L : total);
        int totalPages = (int) Math.ceil((total == null ? 0.0 : total.doubleValue()) / Math.max(1, limit));
        p.setTotalPages(totalPages);
        p.setHasPrev(page > 1);
        p.setHasNext(page < totalPages);

        ExaminerAssessmentsPageResponseDTO resp = new ExaminerAssessmentsPageResponseDTO();
        resp.setItems(items);
        resp.setPagination(p);
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
            if (target == null) {
                // 明确要求：传了 submissionId 不创建，查不到即报错
                throw new BusinessException(BusinessError.INVALID_PARAM);
            }
        } else {
            target = submissionMapper.selectByUniqueTarget(request.getAssignmentId(), request.getSessionId(), normalizeSubjectType(request.getSubjectType()), request.getSubjectId(), examinerId);
            // 若不存在，允许在提交时自动创建一条草稿记录，支持“直接提交”的流程
            if (target == null) {
                // 严格：仅当提供了 assignmentId + subjectType(INDIVIDUAL/GROUP) + subjectId 才允许自动创建
                String normalizedType = normalizeSubjectType(request.getSubjectType());
                if (request.getAssignmentId() == null || normalizedType == null || request.getSubjectId() == null) {
                    throw new BusinessException(BusinessError.INVALID_PARAM);
                }
                Assignment assignment = assignmentMapper.selectById(request.getAssignmentId());
                if (assignment == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
                if (!("INDIVIDUAL".equalsIgnoreCase(normalizedType) || "GROUP".equalsIgnoreCase(normalizedType))) {
                    throw new BusinessException(BusinessError.INVALID_PARAM);
                }
                AssessmentSubmission draft = new AssessmentSubmission();
                draft.setAssignmentId(request.getAssignmentId());
                draft.setSessionId(request.getSessionId());
                draft.setSubjectType(normalizedType);
                draft.setSubjectId(request.getSubjectId());
                draft.setExaminerId(examinerId);
                draft.setStatus("DRAFT");
                draft.setRubricMetaSnapshot(assignment.getRubricMetaInfo());
                draft.setRubricsInfoSnapshot(assignment.getRubricsInfo());
                draft.setScoresJson("[]");
                draft.setCreatedAt(LocalDateTime.now());
                draft.setUpdatedAt(LocalDateTime.now());
                draft.setVersion(0);
                submissionMapper.insert(draft);
                target = draft;
            }
        }
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
                    // points/percentage: 允许携带 selectedLevel，但会被忽略，仅校验 inputPoints
                    if (s.getInputPoints() != null && (s.getInputPoints() < 0 || s.getInputPoints() > 100)) {
                        throw new BusinessException(BusinessError.SCORE_OUT_OF_RANGE);
                    }
                } else if ("descriptive".equalsIgnoreCase(reqType)) {
                    // descriptive: 若提供 inputPoints（0..100）则优先按分数计；否则可使用 selectedLevel
                    if (s.getInputPoints() != null) {
                        if (s.getInputPoints() < 0 || s.getInputPoints() > 100) {
                            throw new BusinessException(BusinessError.SCORE_OUT_OF_RANGE);
                        }
                    }
                    if (s.getSelectedLevel() != null) {
                        Double st = s.getSelectedLevel().getStartPoint();
                        Double ed = s.getSelectedLevel().getEndPoint();
                        if (st == null || ed == null || st < 0 || ed > 100 || st > ed) {
                            throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                        }
                        // 校验所选档与 rubrics 中某一档完全匹配（description + 区间）
                        boolean matchAny = false;
                        if (matched.getPerformanceLevel() != null) {
                            for (PerformanceDto p : matched.getPerformanceLevel()) {
                                String pd = p.getDescription() == null ? null : p.getDescription().trim();
                                String sd = s.getSelectedLevel().getDescription() == null ? null : s.getSelectedLevel().getDescription().trim();
                                if (pd != null && sd != null && pd.equalsIgnoreCase(sd)) {
                                    Double pst = p.getStartPoint();
                                    Double ped = p.getEndPoint();
                                    if (pst != null && ped != null && Math.abs(pst - st) < 1e-6 && Math.abs(ped - ed) < 1e-6) {
                                        matchAny = true; break;
                                    }
                                }
                            }
                        }
                        if (!matchAny) throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
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
                        // 支持传 inputPoints 时直接按百分比计分，否则使用 selectedLevel 的区间中值
                        if (matched.getInputPoints() != null) {
                            Double p = matched.getInputPoints();
                            normalized = p == null ? 0.0 : Math.max(0.0, Math.min(100.0, p));
                        } else if (matched.getSelectedLevel() != null) {
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

    /**
     * 确保每个 rubric 项都已选择有效分值：
     * - points/percentage: 需要 inputPoints 非空且 0..100；
     * - descriptive: 需要 selectedLevel 与 rubrics 中某档完全匹配。
     */
    private void ensureAllCriteriaCompleted(String rubricsInfoSnapshot, String scoresJson) {
        try {
            List<RubricsInfoDto> rubricItems = parseRubricItems(rubricsInfoSnapshot);
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});
            for (RubricsInfoDto r : rubricItems) {
                SaveAssessmentDraftRequestDTO.ScoreItem matched = scores.stream()
                        .filter(s -> r.getDescription() != null && r.getDescription().trim().equalsIgnoreCase(s.getDescription() == null ? "" : s.getDescription().trim()))
                        .findFirst().orElse(null);
                String scale = r.getScaleType();
                if (isPointsLike(scale)) {
                    if (matched == null || matched.getInputPoints() == null) {
                        throw new BusinessException(BusinessError.RUBRIC_CRITERION_INCOMPLETE);
                    }
                } else if ("descriptive".equalsIgnoreCase(scale)) {
                    if (matched == null || matched.getSelectedLevel() == null) {
                        throw new BusinessException(BusinessError.RUBRIC_CRITERION_INCOMPLETE);
                    }
                    // 与 rubrics 档位严格匹配
                    boolean ok = false;
                    if (r.getPerformanceLevel() != null) {
                        for (PerformanceDto p : r.getPerformanceLevel()) {
                            String pd = p.getDescription() == null ? null : p.getDescription().trim();
                            String sd = matched.getSelectedLevel().getDescription() == null ? null : matched.getSelectedLevel().getDescription().trim();
                            if (pd != null && sd != null && pd.equalsIgnoreCase(sd)) {
                                Double pst = p.getStartPoint();
                                Double ped = p.getEndPoint();
                                Double st = matched.getSelectedLevel().getStartPoint();
                                Double ed = matched.getSelectedLevel().getEndPoint();
                                if (pst != null && ped != null && st != null && ed != null && Math.abs(pst - st) < 1e-6 && Math.abs(ped - ed) < 1e-6) {
                                    ok = true; break;
                                }
                            }
                        }
                    }
                    if (!ok) throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                }
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            throw new BusinessException(BusinessError.RUBRIC_PARSE_ERROR.getMessage() + ": " + e.getMessage(), BusinessError.RUBRIC_PARSE_ERROR.getCode());
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
        // 对齐 AssignMode：INDIVIDUAL / GROUP
        if (subjectType.equalsIgnoreCase("INDIVIDUAL") || subjectType.equalsIgnoreCase("STUDENT") || subjectType.equalsIgnoreCase("PERSONAL")) return "INDIVIDUAL";
        if (subjectType.equalsIgnoreCase("GROUP")) return "GROUP";
        return subjectType;
    }

    private String emptyToNull(String s) { return (s == null || s.trim().isEmpty()) ? null : s.trim(); }

    private String normalizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) return "updated_at";
        String col = sortBy.trim().toLowerCase();
        // 允许的排序列白名单，避免注入
        if (col.equals("updated_at") || col.equals("created_at") || col.equals("submitted_at") || col.equals("total_score")) {
            return col;
        }
        return "updated_at";
    }

    private String normalizeSortOrder(String sortOrder) {
        if (sortOrder == null) return "desc";
        String o = sortOrder.trim().toLowerCase();
        return ("asc".equals(o) || "desc".equals(o)) ? o : "desc";
    }
}


