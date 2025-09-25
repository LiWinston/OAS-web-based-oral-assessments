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
import java.util.Arrays;
import java.util.stream.Collectors;
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
        // 1) Assignment existence
        Assignment assignment = assignmentMapper.selectById(request.getAssignmentId());
        if (assignment == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);

        // 2) Session assignment validation (when sessionId is provided)
        if (request.getSessionId() != null) {
            List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(request.getSessionId());
            if (examiners == null || !examiners.contains(examinerId)) {
                throw new BusinessException(BusinessError.NOT_ASSIGNED_TO_SESSION);
            }
        }

        // 2.1 Normalize subjectType synonyms
        String normalizedSubjectType = normalizeSubjectType(request.getSubjectType());

        // 2.2 Query enrollment_id (if sessionId provided)
        Long enrollmentId = null;
        if (request.getSessionId() != null) {
            SessionStudent enrollment = sessionStudentMapper.selectBySessionAndSubject(
                request.getSessionId(), normalizedSubjectType, request.getSubjectId());
            if (enrollment != null) {
                enrollmentId = enrollment.getId();
            }
        }

        // 3) Check if a draft already exists (prefer new method)
        AssessmentSubmission existing = null;
        if (enrollmentId != null) {
            // Use new enrollment_id-based query method
            existing = submissionMapper.selectByEnrollmentAndExaminer(enrollmentId, examinerId);
        } else {
            // Fallback to old unique-key query method
            existing = submissionMapper.selectByUniqueTarget(
                    request.getAssignmentId(), request.getSessionId(), normalizedSubjectType, request.getSubjectId(), examinerId);
        }

        boolean isCreate = (existing == null);
        AssessmentSubmission record = isCreate ? new AssessmentSubmission() : existing;
        record.setStatus("DRAFT");
        if (isCreate) {
            record.setAssignmentId(request.getAssignmentId());
            record.setSessionId(request.getSessionId());
            record.setEnrollmentId(enrollmentId); // Set enrollment_id
            record.setSubjectType(normalizedSubjectType);
            record.setSubjectId(request.getSubjectId());
            record.setExaminerId(examinerId);
            record.setCreatedAt(LocalDateTime.now());
            record.setUpdatedAt(LocalDateTime.now());
            record.setVersion(record.getVersion() == null ? 0 : record.getVersion());
        }

        // 4) Generate/maintain rubric snapshots
        if (isCreate || record.getRubricMetaSnapshot() == null) {
            record.setRubricMetaSnapshot(assignment.getRubricMetaInfo());
        }
        if (isCreate || record.getRubricsInfoSnapshot() == null) {
            record.setRubricsInfoSnapshot(assignment.getRubricsInfo());
        }

        // 5) Validate scores and compute total (draft can be incomplete; partial nulls allowed here)
        String normalizedScoresJson = normalizeAndValidateScores(record.getRubricsInfoSnapshot(), request);
        record.setScoresJson(normalizedScoresJson);
        Double total = computeTotalScore(record.getRubricsInfoSnapshot(), normalizedScoresJson);
        record.setTotalScore(total);

        // 6) Notes and feedback
        record.setOverallFeedback(request.getOverallFeedback());
        record.setAdminNote(request.getAdminNote());

        // 7) Persist
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
        // If this submission carries scores/feedback, sync them into the record before submit
        boolean needUpdateContent = request.getScores() != null || request.getOverallFeedback() != null || request.getAdminNote() != null;
        if (needUpdateContent) {
            // Use saveDraft validation/normalization once
            SaveAssessmentDraftRequestDTO save = new SaveAssessmentDraftRequestDTO();
            save.setAssignmentId(target.getAssignmentId());
            save.setSessionId(target.getSessionId());
            save.setSubjectType(target.getSubjectType());
            save.setSubjectId(target.getSubjectId());
            save.setOverallFeedback(request.getOverallFeedback());
            save.setAdminNote(request.getAdminNote());
            save.setScores(request.getScores());
            AssessmentSubmissionDTO updated = saveDraft(save, examinerId);
            // Reload latest entity
            target = submissionMapper.selectById(updated.getSubmissionId());
        }
        if (!Objects.equals(target.getExaminerId(), examinerId)) {
            throw new BusinessException(SecurityError.INSUFFICIENT_PRIVILEGES);
        }
        if (!"DRAFT".equalsIgnoreCase(target.getStatus())) {
            throw new BusinessException(BusinessError.ASSESSMENT_ALREADY_SUBMITTED);
        }

        // Submission validation: must be able to compute total; if missing, mark incomplete (avoid defaulting to 0)
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
        
        // Return only SUBMITTED and RELEASED statuses
        String filterStatus = query.getStatus();
        if (filterStatus == null || (!filterStatus.equals("SUBMITTED") && !filterStatus.equals("RELEASED"))) {
            // If status is not specified or not SUBMITTED/RELEASED, return empty list
            if (filterStatus != null) {
                return new ArrayList<>();
            }
            // If status is not specified, default to query SUBMITTED and RELEASED
            filterStatus = null; // We'll filter after mapper call
        }
        
        List<AssessmentSubmission> list = submissionMapper.listByExaminer(examinerId, query.getAssignmentId(), filterStatus, from, to);
        
        // If original query didn't specify status, filter to keep only SUBMITTED/RELEASED
        if (query.getStatus() == null) {
            list = list.stream()
                    .filter(submission -> "SUBMITTED".equals(submission.getStatus()) || "RELEASED".equals(submission.getStatus()))
                    .collect(Collectors.toList());
        }
        
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

        // Return only SUBMITTED and RELEASED statuses
        // Return only SUBMITTED and RELEASED statuses
        String filterStatus = query.getStatus();
        List<String> filterStatuses = query.getStatuses();
        
        // Handle single status filter
        if (filterStatus != null && !filterStatus.equals("SUBMITTED") && !filterStatus.equals("RELEASED")) {
            // If specified status is not SUBMITTED/RELEASED, return empty result
            ExaminerAssessmentsPageResponseDTO emptyResp = new ExaminerAssessmentsPageResponseDTO();
            emptyResp.setItems(new ArrayList<>());
            org.swen90017.oas.dto.response.PaginationDTO emptyPagination = new org.swen90017.oas.dto.response.PaginationDTO();
            emptyPagination.setCurrentPage(page);
            emptyPagination.setItemsPerPage(limit);
            emptyPagination.setTotalItems(0L);
            emptyPagination.setTotalPages(0);
            emptyPagination.setHasPrev(false);
            emptyPagination.setHasNext(false);
            emptyResp.setPagination(emptyPagination);
            return emptyResp;
        }
        
        // Handle multi-status filter
        if (filterStatuses != null && !filterStatuses.isEmpty()) {
            filterStatuses = filterStatuses.stream()
                    .filter(status -> "SUBMITTED".equals(status) || "RELEASED".equals(status))
                    .collect(Collectors.toList());
            if (filterStatuses.isEmpty()) {
                // If no valid statuses remain after filtering, return empty result
                ExaminerAssessmentsPageResponseDTO emptyResp = new ExaminerAssessmentsPageResponseDTO();
                emptyResp.setItems(new ArrayList<>());
                org.swen90017.oas.dto.response.PaginationDTO emptyPagination = new org.swen90017.oas.dto.response.PaginationDTO();
                emptyPagination.setCurrentPage(page);
                emptyPagination.setItemsPerPage(limit);
                emptyPagination.setTotalItems(0L);
                emptyPagination.setTotalPages(0);
                emptyPagination.setHasPrev(false);
                emptyPagination.setHasNext(false);
                emptyResp.setPagination(emptyPagination);
                return emptyResp;
            }
        } else if (filterStatus == null) {
            // If status is not specified, default to SUBMITTED and RELEASED
            filterStatuses = Arrays.asList("SUBMITTED", "RELEASED");
        }

        List<AssessmentSubmission> rows = submissionMapper.pageByExaminer(
                examinerId,
                query.getAssignmentId(),
                query.getSessionId(),
                normalizeSubjectType(query.getSubjectType()),
                query.getSubjectId(),
                filterStatus,
                filterStatuses,
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
                filterStatus,
                filterStatuses,
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
        dto.setByAssignment(null); // Simplification: to aggregate by assignment, add aggregate SQL in Mapper
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
                // Explicit requirement: do not create when submissionId is provided; throw if not found
                throw new BusinessException(BusinessError.INVALID_PARAM);
            }
        } else {
            target = submissionMapper.selectByUniqueTarget(request.getAssignmentId(), request.getSessionId(), normalizeSubjectType(request.getSubjectType()), request.getSubjectId(), examinerId);
            // If not exists, allow creating a draft on submit to support "direct submit"
            if (target == null) {
                // Strict: only allow auto-create when assignmentId + subjectType(INDIVIDUAL/GROUP) + subjectId are provided
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

                // scaleType validity (support percentage as a synonym of points)
                String reqType = s.getScaleType();
                String rubType = matched.getScaleType();
                if (reqType == null || rubType == null || !isScaleTypeCompatible(reqType, rubType)) {
                    throw new BusinessException(BusinessError.RUBRIC_MISMATCH);
                }

                // Unified validation: all scores require inputPoints and selectedLevel
                if (s.getInputPoints() == null) {
                    throw new BusinessException(BusinessError.RUBRIC_CRITERION_INCOMPLETE);
                }
                
                if (s.getSelectedLevel() == null) {
                    throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                }
                
                // Validate basic range of inputPoints
                if (s.getInputPoints() < 0 || s.getInputPoints() > 100) {
                    throw new BusinessException(BusinessError.SCORE_OUT_OF_RANGE);
                }
                
                // Validate validity of selectedLevel
                Double st = s.getSelectedLevel().getStartPoint();
                Double ed = s.getSelectedLevel().getEndPoint();
                if (st == null || ed == null || st < 0 || ed > 100 || st > ed) {
                    throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                }
                
                // Validate that the selected level exactly matches a rubric band (description + range)
                boolean matchAny = false;
                if (matched.getPerformanceLevel() != null) {
                    for (PerformanceDto p : matched.getPerformanceLevel()) {
                        String pd = p.getDescription() == null ? null : p.getDescription().trim();
                        String sd = s.getSelectedLevel().getDescription() == null ? null : s.getSelectedLevel().getDescription().trim();
                        if (pd != null && sd != null && pd.equalsIgnoreCase(sd)) {
                            Double pst = p.getStartPoint();
                            Double ped = p.getEndPoint();
                            if (pst != null && ped != null && Math.abs(pst - st) < 1e-6 && Math.abs(ped - ed) < 1e-6) {
                                matchAny = true; 
                                break;
                            }
                        }
                    }
                }
                if (!matchAny) {
                    throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
                }
                
                // Validate that inputPoints is within selectedLevel range
                if (s.getInputPoints() < st || s.getInputPoints() > ed) {
                    throw new BusinessException(BusinessError.SCORE_OUT_OF_RANGE);
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
                if (matched != null && matched.getInputPoints() != null) {
                    // For all types, use inputPoints directly; no longer use range midpoint
                    Double p = matched.getInputPoints();
                    normalized = Math.max(0.0, Math.min(100.0, p));
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
     * Ensure each rubric item has a valid score:
     * - points/percentage: requires non-null inputPoints within 0..100
     * - descriptive: requires selectedLevel exactly matching a rubric band.
     */
    private void ensureAllCriteriaCompleted(String rubricsInfoSnapshot, String scoresJson) {
        try {
            List<RubricsInfoDto> rubricItems = parseRubricItems(rubricsInfoSnapshot);
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});
            for (RubricsInfoDto r : rubricItems) {
                SaveAssessmentDraftRequestDTO.ScoreItem matched = scores.stream()
                        .filter(s -> r.getDescription() != null && r.getDescription().trim().equalsIgnoreCase(s.getDescription() == null ? "" : s.getDescription().trim()))
                        .findFirst().orElse(null);
                
                // Unified validation: all types require inputPoints and selectedLevel
                if (matched == null || matched.getInputPoints() == null) {
                    throw new BusinessException(BusinessError.RUBRIC_CRITERION_INCOMPLETE);
                }
                
                if (matched.getSelectedLevel() == null) {
                    throw new BusinessException(BusinessError.RUBRIC_CRITERION_INCOMPLETE);
                }
                
                // Strictly match rubric bands and validate inputPoints within range
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
                                // Validate that inputPoints is within selectedLevel range
                                if (matched.getInputPoints() >= st && matched.getInputPoints() <= ed) {
                                    ok = true; 
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!ok) throw new BusinessException(BusinessError.INVALID_SELECTED_LEVEL);
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
        // Align with AssignMode: INDIVIDUAL / GROUP
        if (subjectType.equalsIgnoreCase("INDIVIDUAL") || subjectType.equalsIgnoreCase("STUDENT") || subjectType.equalsIgnoreCase("PERSONAL")) return "INDIVIDUAL";
        if (subjectType.equalsIgnoreCase("GROUP")) return "GROUP";
        return subjectType;
    }

    private String emptyToNull(String s) { return (s == null || s.trim().isEmpty()) ? null : s.trim(); }

    private String normalizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) return "updated_at";
        String col = sortBy.trim().toLowerCase();
        // Whitelisted sortable columns to avoid injection
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


