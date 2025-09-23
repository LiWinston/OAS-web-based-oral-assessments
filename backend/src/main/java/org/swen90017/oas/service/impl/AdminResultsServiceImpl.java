package org.swen90017.oas.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.ReleaseAssessmentRequestDTO;
import org.swen90017.oas.dto.request.ReviewExaminerRequestDTO;
import org.swen90017.oas.dto.request.UpdateFinalScoreRequestDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.AdminResultsService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.utils.RubricParser;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminResultsServiceImpl implements AdminResultsService {

    private final AdminResultsMapper adminResultsMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;
    private final SysUserMapper sysUserMapper;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Override
    public PageResult<AssessmentSummaryDTO> listAssessments(Long subjectId, Long assignmentId, 
                                                           Integer pageNum, Integer pageSize,
                                                           String searchQuery, Long sessionId) {
        // Calculate offset
        int offset = (pageNum - 1) * pageSize;
        
        // Get total count
        Integer total = adminResultsMapper.countAssessmentSummaries(subjectId, assignmentId, sessionId, searchQuery);
        
        // Get assessment summaries
        List<Map<String, Object>> rawData = adminResultsMapper.listAssessmentSummaries(
                subjectId, assignmentId, sessionId, searchQuery, offset, pageSize);
        
        // Convert to DTOs and compute scores
        List<AssessmentSummaryDTO> assessments = rawData.stream()
                .map(rawDataMap -> {
                    AssessmentSummaryDTO assessment = mapToAssessmentSummary(rawDataMap);
                    computeAssessmentScores(assessment, rawDataMap);
                    return assessment;
                })
                .collect(Collectors.toList());
        
        return new PageResult<>(pageNum, pageSize, total, assessments);
    }

    @Override
    public AssessmentDetailDTO getAssessmentDetail(Long subjectId, Long assignmentId, Long submissionId) {
        // Get basic assessment info - only use submissionId
        Map<String, Object> assessmentData = adminResultsMapper.getAssessmentDetail(submissionId);
        if (assessmentData == null || assessmentData.isEmpty()) {
            throw new BusinessException(BusinessError.SUBMISSION_NOT_FOUND);
        }
        
        // Get all examiner markings for this assessment
        // Extract required info from assessmentData
        Long actualAssignmentId = (Long) assessmentData.get("assignment_id");
        String subjectType = (String) assessmentData.get("subject_type");
        Long sessionId = (Long) assessmentData.get("session_id");
        Long entityId = (Long) assessmentData.get("subject_id");
        
        List<Map<String, Object>> examinerData = adminResultsMapper.getExaminerMarkings(
                actualAssignmentId, sessionId, subjectType, entityId);
        
        // Convert to DTO
        AssessmentDetailDTO detail = mapToAssessmentDetail(assessmentData, examinerData);
        
        // Compute scores
        computeDetailedAssessmentScores(detail);
        
        return detail;
    }

    @Override
    public ExaminerMarkDetailDTO getExaminerMarkDetail(Long subjectId, Long assignmentId, 
                                                      Long submissionId, Long examinerId) {
        Map<String, Object> examinerData = adminResultsMapper.getExaminerMarkDetail(submissionId, examinerId);
        if (examinerData == null || examinerData.isEmpty()) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_ASSIGNED_TO_SUBMISSION);
        }
        
        return mapToExaminerMarkDetail(examinerData);
    }

    @Override
    @Transactional
    public ReviewExaminerResponseDTO reviewExaminerMarking(Long subjectId, Long assignmentId, 
                                                          Long submissionId, Long examinerId,
                                                          ReviewExaminerRequestDTO request, Long adminUserId) {
        // Find the specific submission
        AssessmentSubmission submission = assessmentSubmissionMapper.selectById(submissionId);
        if (submission == null || !submission.getExaminerId().equals(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_ASSIGNED_TO_SUBMISSION);
        }
        
        // Check if already reopened
        if ("REOPENED".equals(submission.getStatus())) {
            throw new BusinessException(BusinessError.ALREADY_REOPENED);
        }
        
        // Reopen the examiner's assessment
        int updated = adminResultsMapper.reopenExaminerAssessment(submissionId, examinerId);
        if (updated == 0) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_ASSIGNED_TO_SUBMISSION);
        }
        
        // If assessment was released, set it back to NOT_RELEASED
        String newReleaseStatus = "NOT_RELEASED";
        adminResultsMapper.updateAssessmentReleaseStatus(assignmentId, newReleaseStatus);
        
        // Send email notification to examiner
        boolean notified = false;
        try {
            SysUser examiner = sysUserMapper.selectById(examinerId);
            if (examiner != null && examiner.getEmail() != null) {
                emailService.sendExaminerReviewNotification(examiner.getEmail(), 
                        examiner.getUserName(), request.getReason());
                notified = true;
            }
        } catch (Exception e) {
            log.warn("Failed to send review notification to examiner {}: {}", examinerId, e.getMessage());
        }
        
        ReviewExaminerResponseDTO response = new ReviewExaminerResponseDTO();
        response.setReopened(true);
        response.setReleaseStatus(newReleaseStatus);
        response.setNotified(notified);
        
        return response;
    }

    @Override
    @Transactional
    public AssessmentDetailDTO setFinalScore(Long subjectId, Long assignmentId, Long submissionId,
                                            UpdateFinalScoreRequestDTO request, Long adminUserId) {
        // Find any submission for this assessment to get identifiers
        AssessmentSubmission submission = assessmentSubmissionMapper.selectById(submissionId);
        if (submission == null) {
            throw new BusinessException(BusinessError.SUBMISSION_NOT_FOUND);
        }
        
        // Set final score override for all submissions of this assessment
        // For group assessments, this will update all group members' individual submissions
        // For individual assessments, this will update only the specific student's submissions
        int updated = adminResultsMapper.setFinalScoreOverride(
                assignmentId, submission.getSessionId(),
                submission.getSubjectType(), submission.getSubjectId(),
                request.getFinalScorePct1dp(), request.getReason(), adminUserId);
        
        if (updated == 0) {
            throw new BusinessException(BusinessError.SUBMISSION_NOT_FOUND);
        }
        
        // Return updated assessment detail
        return getAssessmentDetail(subjectId, assignmentId, submissionId);
    }

    @Override
    @Transactional
    public ReleaseAssessmentResponseDTO releaseAssessment(Long subjectId, Long assignmentId, 
                                                         Long submissionId, ReleaseAssessmentRequestDTO request, 
                                                         Long adminUserId) {
        // Find submission to get identifiers
        AssessmentSubmission submission = assessmentSubmissionMapper.selectById(submissionId);
        if (submission == null) {
            throw new BusinessException(BusinessError.SUBMISSION_NOT_FOUND);
        }
        
        // Check if at least one examiner has submitted
        List<Map<String, Object>> examinerMarkings = adminResultsMapper.getExaminerMarkings(
                assignmentId, submission.getSessionId(), 
                submission.getSubjectType(), submission.getSubjectId());
        
        boolean hasSubmittedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "SUBMITTED".equals(marking.get("assessment_status")) ||  "REOPENED".equals(marking.get("assessment_status")) );
        
        if (!hasSubmittedExaminers) {
            throw new BusinessException(BusinessError.NO_SUBMITTED_EXAMINERS);
        }
        
        // Update assessment_submission status to RELEASED
        int updatedSubmissions = adminResultsMapper.updateAssessmentSubmissionStatus(
                assignmentId, submission.getSessionId(), 
                submission.getSubjectType(), submission.getSubjectId(), "RELEASED");
        
        // Count distinct students affected by the status update
        int notifiedStudents = 0;
        if (updatedSubmissions > 0) {
            notifiedStudents = adminResultsMapper.countDistinctStudentsForAssessment(
                    assignmentId, submission.getSessionId(), 
                    submission.getSubjectType(), submission.getSubjectId());
        }
        adminResultsMapper.updateAssignmentReleaseStatus(assignmentId, true);

        // Only update assignment release status if we actually updated some submissions
        boolean released = false;
        if (notifiedStudents > 0) {
            // Also update the assignment's is_released field to true
            released = true;
        }
        
        // Send notification to students if requested and we have students to notify
        if (request.getNotify() != null && request.getNotify() && notifiedStudents > 0) {
            try {
                // TODO: Implement student notification logic
                // This would send notifications to the specific students affected
                log.info("Would send release notification to {} students for assignment {}", 
                        notifiedStudents, assignmentId);
            } catch (Exception e) {
                log.warn("Failed to send release notification: {}", e.getMessage());
            }
        }
        
        ReleaseAssessmentResponseDTO response = new ReleaseAssessmentResponseDTO();
        response.setReleased(released);
        response.setNotifiedStudents(notifiedStudents);
        
        return response;
    }

    // Helper methods for mapping and computation

    private AssessmentSummaryDTO mapToAssessmentSummary(Map<String, Object> data) {
        AssessmentSummaryDTO dto = new AssessmentSummaryDTO();
        
        // Assessment info
        AssessmentSummaryDTO.AssessmentInfo assessmentInfo = new AssessmentSummaryDTO.AssessmentInfo();
        AssessmentKeyDTO key = new AssessmentKeyDTO();
        key.setAssignmentId((Long) data.get("assignment_id"));
        key.setSessionId((Long) data.get("session_id"));
        
        // Parse submission_ids from GROUP_CONCAT result
        String submissionIdsStr = (String) data.get("submission_ids");
        if (submissionIdsStr != null && !submissionIdsStr.isEmpty()) {
            List<Long> submissionIds = Arrays.stream(submissionIdsStr.split(","))
                    .map(String::trim)
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
            // Set the first submission ID for backward compatibility
            key.setSubmissionId(submissionIds.isEmpty() ? null : submissionIds.get(0));
        }
        
        key.setEntityId((Long) data.get("subject_id"));
        assessmentInfo.setKey(key);
        
        // Student/Group info
        if ("INDIVIDUAL".equals(data.get("subject_type"))) {
            AssessmentSummaryDTO.AssessmentInfo.StudentInfo student = 
                    new AssessmentSummaryDTO.AssessmentInfo.StudentInfo();
            student.setId((Long) data.get("subject_id"));
            student.setName((String) data.get("entity_name"));
            assessmentInfo.setStudent(student);
        } else if ("GROUP".equals(data.get("subject_type"))) {
            AssessmentSummaryDTO.AssessmentInfo.GroupInfo group = 
                    new AssessmentSummaryDTO.AssessmentInfo.GroupInfo();
            group.setId((Long) data.get("subject_id"));
            group.setName((String) data.get("entity_name"));
            // Set member count if available from query
            if (data.get("group_member_count") != null) {
                group.setMemberCount(((Number) data.get("group_member_count")).intValue());
            }
            assessmentInfo.setGroup(group);
        }
        
        dto.setAssessment(assessmentInfo);
        
        // Session info with timing and venue details
        AssessmentSessionDTO session = new AssessmentSessionDTO();
        session.setId((Long) data.get("session_id"));
        session.setTimezone("Australia/Melbourne"); // Default timezone
        
        // Set session timing if available
        LocalDateTime startAt = (LocalDateTime) data.get("session_start_at");
        LocalDateTime endAt = (LocalDateTime) data.get("session_end_at");
        if (startAt != null) {
            session.setStart(formatDateTime(startAt));
        }
        if (endAt != null) {
            session.setEnd(formatDateTime(endAt));
        }
        
        // Set venue information if available
        Long venueId = (Long) data.get("session_venue_id");
        String venueName = (String) data.get("venue_name");
        if (venueId != null) {
            AssessmentSessionDTO.VenueInfo venue = new AssessmentSessionDTO.VenueInfo();
            venue.setVenueId(venueId);
            venue.setName(venueName);
            session.setVenue(venue);
        }
        
        dto.setSession(session);
        
        // Computed scores (will be filled by computeAssessmentScores)
        AssessmentComputedDTO computed = new AssessmentComputedDTO();
        
        // Check for manual override from query results
        if (data.get("final_score_override_pct") != null) {
            AssessmentComputedDTO.ManualOverrideInfo override = new AssessmentComputedDTO.ManualOverrideInfo();
            override.setValuePct1dp(convertToDouble(data.get("final_score_override_pct")));
            override.setReason((String) data.get("final_score_override_reason"));
            override.setAt(formatDateTime((LocalDateTime) data.get("final_score_override_at")));
            
            // Populate user information for the override
            Long overrideByUserId = (Long) data.get("final_score_override_by");
            if (overrideByUserId != null) {
                SysUser user = sysUserMapper.selectById(overrideByUserId);
                if (user != null) {
                    AssessmentComputedDTO.ManualOverrideInfo.UserInfo userInfo = 
                        new AssessmentComputedDTO.ManualOverrideInfo.UserInfo();
                    userInfo.setId(user.getUserId());
                    userInfo.setName(user.getUserName());
                    override.setBy(userInfo);
                }
            }
            
            computed.setManualOverride(override);
        }
        
        dto.setComputed(computed);
        
        // Release status
        dto.setReleaseStatus((String) data.getOrDefault("release_status", "NOT_RELEASED"));
        
        return dto;
    }

    private AssessmentDetailDTO mapToAssessmentDetail(Map<String, Object> assessmentData, 
                                                     List<Map<String, Object>> examinerData) {
        AssessmentDetailDTO detail = new AssessmentDetailDTO();
        
        // Map basic assessment info (similar to summary)
        AssessmentSummaryDTO.AssessmentInfo assessmentInfo = new AssessmentSummaryDTO.AssessmentInfo();
        
        // Create assessment key
        AssessmentKeyDTO key = new AssessmentKeyDTO();
        key.setAssignmentId((Long) assessmentData.get("assignment_id"));
        key.setSessionId((Long) assessmentData.get("session_id"));
        key.setSubmissionId(0L); // Will be set based on composite key
        key.setEntityId((Long) assessmentData.get("subject_id"));
        assessmentInfo.setKey(key);
        
        // Map student/group info
        if ("INDIVIDUAL".equals(assessmentData.get("subject_type"))) {
            AssessmentSummaryDTO.AssessmentInfo.StudentInfo student = 
                    new AssessmentSummaryDTO.AssessmentInfo.StudentInfo();
            student.setId((Long) assessmentData.get("subject_id"));
            student.setName((String) assessmentData.get("entity_name"));
            assessmentInfo.setStudent(student);
        } else if ("GROUP".equals(assessmentData.get("subject_type"))) {
            AssessmentSummaryDTO.AssessmentInfo.GroupInfo group = 
                    new AssessmentSummaryDTO.AssessmentInfo.GroupInfo();
            group.setId((Long) assessmentData.get("subject_id"));
            group.setName((String) assessmentData.get("entity_name"));
            // Set member count if available from query
            if (assessmentData.get("group_member_count") != null) {
                group.setMemberCount(((Number) assessmentData.get("group_member_count")).intValue());
            }
            assessmentInfo.setGroup(group);
        }
        
        detail.setAssessment(assessmentInfo);
        
        // Map session info with timing and venue details
        AssessmentSessionDTO session = new AssessmentSessionDTO();
        session.setId((Long) assessmentData.get("session_id"));
        session.setTimezone("Australia/Melbourne"); // Default timezone
        
        // Set session timing if available
        LocalDateTime startAt = (LocalDateTime) assessmentData.get("session_start_at");
        LocalDateTime endAt = (LocalDateTime) assessmentData.get("session_end_at");
        if (startAt != null) {
            session.setStart(formatDateTime(startAt));
        }
        if (endAt != null) {
            session.setEnd(formatDateTime(endAt));
        }
        
        // Set venue information if available
        Long venueId = (Long) assessmentData.get("session_venue_id");
        String venueName = (String) assessmentData.get("venue_name");
        if (venueId != null) {
            AssessmentSessionDTO.VenueInfo venue = new AssessmentSessionDTO.VenueInfo();
            venue.setVenueId(venueId);
            venue.setName(venueName);
            session.setVenue(venue);
        }
        
        detail.setSession(session);
        
        // Map rubric info
        AdminRubricDTO rubric = mapToRubricDTO(assessmentData);
        detail.setRubric(rubric);
        
        // Map examiner markings
        List<ExaminerMarkDetailDTO> examiners = examinerData.stream()
                .map(this::mapToExaminerMarkDetail)
                .collect(Collectors.toList());
        detail.setExaminers(examiners);
        
        // Computed scores (will be filled by computeDetailedAssessmentScores)
        AssessmentComputedDTO computed = new AssessmentComputedDTO();
        
        // Check for manual override from query results
        if (assessmentData.get("final_score_override_pct") != null) {
            AssessmentComputedDTO.ManualOverrideInfo override = new AssessmentComputedDTO.ManualOverrideInfo();
            override.setValuePct1dp(convertToDouble(assessmentData.get("final_score_override_pct")));
            override.setReason((String) assessmentData.get("final_score_override_reason"));
            override.setAt(formatDateTime((LocalDateTime) assessmentData.get("final_score_override_at")));
            
            // Populate user information for the override
            Long overrideByUserId = (Long) assessmentData.get("final_score_override_by");
            if (overrideByUserId != null) {
                SysUser user = sysUserMapper.selectById(overrideByUserId);
                if (user != null) {
                    AssessmentComputedDTO.ManualOverrideInfo.UserInfo userInfo = 
                        new AssessmentComputedDTO.ManualOverrideInfo.UserInfo();
                    userInfo.setId(user.getUserId());
                    userInfo.setName(user.getUserName());
                    override.setBy(userInfo);
                }
            }
            
            computed.setManualOverride(override);
        }
        
        detail.setComputed(computed);
        detail.setReleaseStatus("NOT_RELEASED");
        
        return detail;
    }

    private AdminRubricDTO mapToRubricDTO(Map<String, Object> data) {
        AdminRubricDTO rubric = new AdminRubricDTO();
        
        try {
            // Parse rubric meta info
            String rubricMetaJson = (String) data.get("rubric_meta_info");
            if (rubricMetaJson != null) {
                RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
                AdminRubricMetaInfoDTO metaDTO = new AdminRubricMetaInfoDTO();
                metaDTO.setRubricId(1L); // Placeholder
                metaDTO.setName(metaInfo.getName());
                metaDTO.setScale("points".equals(metaInfo.getWeightBasis()) ? "points" : "weight");
                metaDTO.setMaxPoints(metaInfo.getTotalPoints());
                rubric.setRubricMetaInfo(metaDTO);
            }
            
            // Parse rubric criteria
            String rubricsInfoJson = (String) data.get("rubrics_info");
            if (rubricsInfoJson != null) {
                List<RubricsInfoDto> criteriaList = RubricParser.parseRubricItems(objectMapper, rubricsInfoJson);
                List<AdminRubricCriterionDTO> criteria = criteriaList.stream()
                        .map(this::mapToRubricCriterion)
                        .collect(Collectors.toList());
                rubric.setCriteria(criteria);
            }
        } catch (Exception e) {
            log.error("Error parsing rubric data", e);
            // Return empty rubric
            rubric.setRubricMetaInfo(new AdminRubricMetaInfoDTO());
            rubric.setCriteria(new ArrayList<>());
        }
        
        return rubric;
    }

    private AdminRubricCriterionDTO mapToRubricCriterion(RubricsInfoDto rubricInfo) {
        AdminRubricCriterionDTO criterion = new AdminRubricCriterionDTO();
        criterion.setCriterionId(rubricInfo.getDescription()); // Using description as ID
        criterion.setTitle(rubricInfo.getDescription());
        criterion.setWeightOrPoints(rubricInfo.getWeight());
        
        if (rubricInfo.getPerformanceLevel() != null) {
            List<AdminRubricCriterionDTO.PerformanceLevel> levels = rubricInfo.getPerformanceLevel()
                    .stream()
                    .map(perf -> {
                        AdminRubricCriterionDTO.PerformanceLevel level = 
                                new AdminRubricCriterionDTO.PerformanceLevel();
                        level.setLevelId(perf.getDescription());
                        level.setLabel(perf.getDescription());
                        level.setValue(perf.getStartPoint());
                        level.setDescription(perf.getDescription());
                        return level;
                    })
                    .collect(Collectors.toList());
            criterion.setPerformanceLevels(levels);
        }
        
        return criterion;
    }

    private ExaminerMarkDetailDTO mapToExaminerMarkDetail(Map<String, Object> data) {
        ExaminerMarkDetailDTO detail = new ExaminerMarkDetailDTO();
        detail.setExaminerId((Long) data.get("examiner_id"));
        detail.setName((String) data.get("examiner_name"));
        detail.setAssessmentStatus((String) data.get("assessment_status"));
        detail.setSubmittedAt(formatDateTime((LocalDateTime) data.get("submitted_at")));
        detail.setExaminerScorePct1dp(convertToDouble(data.get("total_score")));
        detail.setOverallFeedback((String) data.get("overall_feedback"));
        detail.setNotes((String) data.get("notes"));
        
        // Parse scores JSON to get rubric items
        try {
            String scoresJson = (String) data.get("scores_json");
            if (scoresJson != null && !scoresJson.trim().isEmpty()) {
                List<SaveAssessmentDraftRequestDTO.ScoreItem> scoreItems = objectMapper.readValue(
                    scoresJson, 
                    new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {}
                );
                
                List<ExaminerMarkDetailDTO.RubricItem> rubricItems = new ArrayList<>();
                for (SaveAssessmentDraftRequestDTO.ScoreItem scoreItem : scoreItems) {
                    ExaminerMarkDetailDTO.RubricItem rubricItem = new ExaminerMarkDetailDTO.RubricItem();
                    
                    // Map basic fields
                    rubricItem.setCriterionId(scoreItem.getDescription()); // Using description as criterion ID
                    rubricItem.setPoints(scoreItem.getInputPoints());
                    
                    // Map selected level if available
                    if (scoreItem.getSelectedLevel() != null) {
                        rubricItem.setLevelId(scoreItem.getSelectedLevel().getDescription());
                    }
                    
                    // Map comments
                    List<ExaminerMarkDetailDTO.RubricItem.Comment> comments = new ArrayList<>();
                    if (scoreItem.getComment() != null && !scoreItem.getComment().trim().isEmpty()) {
                        ExaminerMarkDetailDTO.RubricItem.Comment comment = new ExaminerMarkDetailDTO.RubricItem.Comment();
                        comment.setSource("custom");
                        comment.setText(scoreItem.getComment());
                        comments.add(comment);
                    }
                    rubricItem.setComments(comments);
                    
                    rubricItems.add(rubricItem);
                }
                detail.setItems(rubricItems);
            } else {
                detail.setItems(new ArrayList<>());
            }
        } catch (Exception e) {
            log.error("Error parsing scores JSON", e);
            detail.setItems(new ArrayList<>());
        }
        
        return detail;
    }

    private void computeAssessmentScores(AssessmentSummaryDTO assessment, Map<String, Object> rawData) {
        // Get all examiner markings for this assessment
        Long assignmentId = assessment.getAssessment().getKey().getAssignmentId();
        Long sessionId = assessment.getAssessment().getKey().getSessionId();
        String subjectType = (String) rawData.get("subject_type"); // INDIVIDUAL or GROUP
        Long subjectId = assessment.getAssessment().getKey().getEntityId();
        
        List<Map<String, Object>> examinerMarkings = adminResultsMapper.getExaminerMarkings(
                assignmentId, sessionId, subjectType, subjectId);
        
        // Calculate average from SUBMITTED examiners
        List<Double> submittedScores = examinerMarkings.stream()
                .filter(marking -> "SUBMITTED".equals(marking.get("assessment_status")))
                .map(marking -> convertToDouble(marking.get("total_score")))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        Double averageScore = submittedScores.isEmpty() ? null : 
                submittedScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        // Check for manual override (already set in mapToAssessmentSummary)
        AssessmentComputedDTO computed = assessment.getComputed();
        Double effectiveScore = computed.getManualOverride() != null ? 
                computed.getManualOverride().getValuePct1dp() : averageScore;
        
        computed.setAverageScorePct1dp(averageScore);
        computed.setEffectiveFinalScorePct1dp(effectiveScore);
    }

    private void computeDetailedAssessmentScores(AssessmentDetailDTO detail) {
        // Similar to computeAssessmentScores but for detailed view
        // Implementation would be similar but with more detailed override information
        
        List<Double> submittedScores = detail.getExaminers().stream()
                .filter(examiner -> "SUBMITTED".equals(examiner.getAssessmentStatus()))
                .map(ExaminerMarkDetailDTO::getExaminerScorePct1dp)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        Double averageScore = submittedScores.isEmpty() ? null : 
                submittedScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        // Check if computed scores were already set in mapToAssessmentSummary (which includes override info)
        AssessmentComputedDTO computed = detail.getComputed();
        if (computed == null) {
            computed = new AssessmentComputedDTO();
            detail.setComputed(computed);
        }
        
        computed.setAverageScorePct1dp(averageScore);
        
        // Set effective final score - use manual override if available, otherwise use average
        Double effectiveScore = computed.getManualOverride() != null ? 
                computed.getManualOverride().getValuePct1dp() : averageScore;
        computed.setEffectiveFinalScorePct1dp(effectiveScore);
    }

    /**
     * Safely converts a database value to Double, handling BigDecimal conversion
     * @param value The value from database (could be BigDecimal, Double, or null)
     * @return Double value or null if input is null
     */
    private Double convertToDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Double) {
            return (Double) value;
        }
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).doubleValue();
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        throw new IllegalArgumentException("Cannot convert " + value.getClass().getSimpleName() + " to Double");
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.atZone(ZoneId.of("Australia/Melbourne")).format(ISO_FORMATTER);
    }
}
