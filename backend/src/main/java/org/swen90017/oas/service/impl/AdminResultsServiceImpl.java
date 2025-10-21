package org.swen90017.oas.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.ReleaseAssessmentRequestDTO;
import org.swen90017.oas.dto.request.ReviewExaminerRequestDTO;
import org.swen90017.oas.dto.request.UpdateFinalScoreRequestDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.AdminResultsService;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.utils.RubricParser;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
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
    private final AssignmentMapper assignmentMapper;
    private final SysUserMapper sysUserMapper;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    @Override
    public PageResult<AssessmentSummaryDTO> listAssessments(Long subjectId, Long assignmentId,
                                                           Integer pageNum, Integer pageSize,
                                                           String searchQuery, Long sessionId,
                                                           Boolean isReleased, String examinerStatus,
                                                           Boolean includeAll) {
        int safePageNum = (pageNum == null || pageNum < 1) ? 1 : pageNum;
        int safePageSize = (pageSize == null || pageSize < 1) ? 20 : pageSize;
        boolean fetchAll = Boolean.TRUE.equals(includeAll);
        String progressFilter = normaliseExaminerStatus(examinerStatus);

        Integer offset = fetchAll ? null : (safePageNum - 1) * safePageSize;
        Integer limit = fetchAll ? null : safePageSize;

        Integer total = fetchAll
                ? null
                : adminResultsMapper.countAssessmentSummaries(
                        subjectId, assignmentId, sessionId, searchQuery, isReleased, progressFilter);

        List<Map<String, Object>> rawData = adminResultsMapper.listAssessmentSummaries(
                subjectId, assignmentId, sessionId, searchQuery, offset, limit, isReleased, progressFilter);

        if (fetchAll) {
            total = rawData != null ? rawData.size() : 0;
            safePageNum = 1;
            safePageSize = total;
        } else if (total == null) {
            total = 0;
        }

        List<AssessmentSummaryDTO> assessments = (rawData == null ? Collections.<Map<String, Object>>emptyList() : rawData).stream()
                .map(rawDataMap -> {
                    AssessmentSummaryDTO assessment = mapToAssessmentSummary(rawDataMap);
                    computeAssessmentScores(assessment, rawDataMap);
                    return assessment;
                })
                .collect(Collectors.toList());

        return new PageResult<>(safePageNum, safePageSize, total, assessments);
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
        
        // Reopen the examiner's assessment with admin note
        int updated = adminResultsMapper.reopenExaminerAssessment(submissionId, examinerId, request.getReason());
        if (updated == 0) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_ASSIGNED_TO_SUBMISSION);
        }
        
        // If assessment was released, set release_status back to NOT_RELEASED
        // Use existing submission info to update the corresponding assessment_submission record
        adminResultsMapper.updateAssessmentSubmissionReleaseStatus(
                assignmentId, submission.getSessionId(), 
                submission.getSubjectType(), submission.getSubjectId(), "NOT_RELEASED");
        String newReleaseStatus = "NOT_RELEASED";
        
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
        
        // Check if this is a mix rubric assignment - if so, prevent manual override
        try {
            String rubricMetaJson = submission.getRubricMetaSnapshot();
            if (rubricMetaJson != null) {
                RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
                Double individualWeight = metaInfo.getIndividualWeight() != null ? metaInfo.getIndividualWeight() : 0.0;
                Double groupWeight = metaInfo.getGroupWeight() != null ? metaInfo.getGroupWeight() : 0.0;
                
                // If both weights are > 0, this is a mix rubric type - prevent manual override
                if (individualWeight > 0 && groupWeight > 0) {
                    throw new BusinessException(BusinessError.MIX_RUBRIC_MANUAL_OVERRIDE_FORBIDDEN);
                }
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not parse rubric meta info to check for mix rubric type: {}", e.getMessage());
            // Continue with manual override if we can't parse the rubric meta
        }
        
        // Set final score override for all examiner submissions of the same student in the same assignment
        // This will update all examiner assessments for this student across all sessions in this assignment
        int updated = adminResultsMapper.setFinalScoreOverrideForAllExaminers(
                assignmentId, submissionId,
                request.getFinalScorePct1dp(), request.getReason(), adminUserId);
        
        if (updated == 0) {
            throw new BusinessException(BusinessError.SUBMISSION_NOT_FOUND);
        }
        
        // Return updated assessment detail
        return getAssessmentDetail(subjectId, assignmentId, submissionId);
    }

    @Override
    @Deprecated
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
        
        // Check for REOPENED status - should not allow release if any examiner has REOPENED status
        boolean hasReopenedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "REOPENED".equals(marking.get("assessment_status")));
        
        if (hasReopenedExaminers) {
            throw new BusinessException("409", "Cannot release results while some assessments are reopened. Examiners must resubmit before release.");
        }
        
        boolean hasSubmittedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "SUBMITTED".equals(marking.get("assessment_status")));
        
        if (!hasSubmittedExaminers) {
            throw new BusinessException(BusinessError.NO_SUBMITTED_EXAMINERS);
        }
        
        // Update assessment_submission release_status to RELEASED (without changing status)
        int updatedSubmissions = adminResultsMapper.updateAssessmentSubmissionReleaseStatus(
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

    @Override
    @Transactional
    public ReleaseAssessmentResponseDTO releaseGroupAssessment(Long subjectId, Long assignmentId,
                                                              Long groupId, ReleaseAssessmentRequestDTO request,
                                                              Long adminUserId) {
        // Get group detail to retrieve session information
        Map<String, Object> detailData = adminResultsMapper.getGroupDetailWithExaminers(assignmentId, groupId);
        if (detailData == null || detailData.isEmpty()) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        Long sessionId = (Long) detailData.get("session_id");
        if (sessionId == null) {
            throw new BusinessException("404", "No session found for this group in the assignment");
        }
        
        // Check if at least one examiner has submitted
        List<Map<String, Object>> examinerMarkings = adminResultsMapper.getExaminerMarkings(
                assignmentId, sessionId, "GROUP", groupId);
        
        // Check for REOPENED status - should not allow release if any examiner has REOPENED status
        boolean hasReopenedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "REOPENED".equals(marking.get("assessment_status")));
        
        if (hasReopenedExaminers) {
            throw new BusinessException("409", "Cannot release results while some assessments are reopened. Examiners must resubmit before release.");
        }
        
        boolean hasSubmittedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "SUBMITTED".equals(marking.get("assessment_status")));
        
        if (!hasSubmittedExaminers) {
            throw new BusinessException(BusinessError.NO_SUBMITTED_EXAMINERS);
        }
        
        // Update assessment_submission release_status to RELEASED for all examiners
        int updatedSubmissions = adminResultsMapper.updateAssessmentSubmissionReleaseStatus(
                assignmentId, sessionId, "GROUP", groupId, "RELEASED");
        
        // Count distinct students affected by the status update
        int notifiedStudents = 0;
        if (updatedSubmissions > 0) {
            notifiedStudents = adminResultsMapper.countDistinctStudentsForAssessment(
                    assignmentId, sessionId, "GROUP", groupId);
        }
        adminResultsMapper.updateAssignmentReleaseStatus(assignmentId, true);

        // Only update assignment release status if we actually updated some submissions
        boolean released = false;
        if (notifiedStudents > 0) {
            released = true;
        }
        
        // Send notification to students if requested and we have students to notify
        if (request.getNotify() != null && request.getNotify() && notifiedStudents > 0) {
            try {
                // TODO: Implement student notification logic
                log.info("Would send release notification to {} students for group {} in assignment {}", 
                        notifiedStudents, groupId, assignmentId);
            } catch (Exception e) {
                log.warn("Failed to send release notification: {}", e.getMessage());
            }
        }
        
        ReleaseAssessmentResponseDTO response = new ReleaseAssessmentResponseDTO();
        response.setReleased(released);
        response.setNotifiedStudents(notifiedStudents);
        
        return response;
    }

    @Override
    @Transactional
    public ReleaseAssessmentResponseDTO releaseIndividualAssessment(Long subjectId, Long assignmentId,
                                                                   Long studentId, ReleaseAssessmentRequestDTO request,
                                                                   Long adminUserId) {
        // Get individual detail to retrieve session information
        Map<String, Object> detailData = adminResultsMapper.getIndividualDetailWithExaminers(assignmentId, studentId);
        if (detailData == null || detailData.isEmpty()) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
        
        Long sessionId = (Long) detailData.get("session_id");
        if (sessionId == null) {
            throw new BusinessException("404", "No session found for this student in the assignment");
        }
        
        // Check if at least one examiner has submitted
        List<Map<String, Object>> examinerMarkings = adminResultsMapper.getExaminerMarkings(
                assignmentId, sessionId, "INDIVIDUAL", studentId);
        
        // Check for REOPENED status - should not allow release if any examiner has REOPENED status
        boolean hasReopenedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "REOPENED".equals(marking.get("assessment_status")));
        
        if (hasReopenedExaminers) {
            throw new BusinessException("409", "Cannot release results while some assessments are reopened. Examiners must resubmit before release.");
        }
        
        boolean hasSubmittedExaminers = examinerMarkings.stream()
                .anyMatch(marking -> "SUBMITTED".equals(marking.get("assessment_status")));
        
        if (!hasSubmittedExaminers) {
            throw new BusinessException(BusinessError.NO_SUBMITTED_EXAMINERS);
        }
        
        // Update assessment_submission release_status to RELEASED for all examiners
        int updatedSubmissions = adminResultsMapper.updateAssessmentSubmissionReleaseStatus(
                assignmentId, sessionId, "INDIVIDUAL", studentId, "RELEASED");
        
        // Count distinct students affected by the status update
        int notifiedStudents = 0;
        if (updatedSubmissions > 0) {
            notifiedStudents = adminResultsMapper.countDistinctStudentsForAssessment(
                    assignmentId, sessionId, "INDIVIDUAL", studentId);
        }
        adminResultsMapper.updateAssignmentReleaseStatus(assignmentId, true);

        // Only update assignment release status if we actually updated some submissions
        boolean released = false;
        if (notifiedStudents > 0) {
            released = true;
        }
        
        // Send notification to students if requested and we have students to notify
        if (request.getNotify() != null && request.getNotify() && notifiedStudents > 0) {
            try {
                // TODO: Implement student notification logic
                log.info("Would send release notification to student {} in assignment {}", 
                        studentId, assignmentId);
            } catch (Exception e) {
                log.warn("Failed to send release notification: {}", e.getMessage());
            }
        }
        
        ReleaseAssessmentResponseDTO response = new ReleaseAssessmentResponseDTO();
        response.setReleased(released);
        response.setNotifiedStudents(notifiedStudents);
        
        return response;
    }

    private String normaliseExaminerStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "all";
        }
        String value = status.trim().toLowerCase(Locale.ROOT);
        switch (value) {
            case "ready":
            case "complete":
            case "submitted":
            case "all_submitted":
                return "ready";
            case "attention":
            case "needs_attention":
            case "reopened":
            case "reopen":
                return "attention";
            case "incomplete":
            case "draft":
            case "in_progress":
            case "partial":
                return "incomplete";
            default:
                return "all";
        }
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
        List<Long> submissionIds = Collections.emptyList();
        if (submissionIdsStr != null && !submissionIdsStr.isEmpty()) {
            submissionIds = Arrays.stream(submissionIdsStr.split(","))
                    .map(String::trim)
                    .filter(segment -> !segment.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
            // Set the first submission ID for backward compatibility
            key.setSubmissionId(submissionIds.isEmpty() ? null : submissionIds.get(0));
        }
        key.setSubmissionIds(submissionIds);
        
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
        
        // Examiner aggregates derived from query
        AssessmentSummaryDTO.ExaminerSummary examinerSummary = buildExaminerSummaryFromRow(data);
        dto.setExaminerSummary(examinerSummary);
        dto.setLastSubmittedAt(formatDateTime((LocalDateTime) data.get("last_submitted_at")));
        dto.setLastUpdatedAt(formatDateTime((LocalDateTime) data.get("last_updated_at")));
        
        return dto;
    }

    private AssessmentSummaryDTO.ExaminerSummary buildExaminerSummaryFromRow(Map<String, Object> data) {
        AssessmentSummaryDTO.ExaminerSummary summary = new AssessmentSummaryDTO.ExaminerSummary();

        int total = convertToInteger(data.get("total_examiner_count"));
        int submitted = convertToInteger(data.get("submitted_examiner_count"));
        int draft = convertToInteger(data.get("draft_examiner_count"));
        int reopened = convertToInteger(data.get("reopened_examiner_count"));

        summary.setTotal(total);
        summary.setSubmitted(submitted);
        summary.setDraft(draft);
        summary.setReopened(reopened);
        summary.setPending(Math.max(total - submitted, 0));
        summary.setSubmittedRatio(total > 0 ? (double) submitted / total : 0.0);
        summary.setAllSubmitted(total > 0 && submitted == total && reopened == 0);
        summary.setAnyDraft(draft > 0);
        summary.setAnyReopened(reopened > 0);

        return summary;
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
        key.setSubmissionId((Long)assessmentData.get("submission_id"));
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
        
        // Set release status based on release_status field
        String releaseStatus = (String) assessmentData.get("release_status");
        detail.setReleaseStatus(releaseStatus != null ? releaseStatus : "NOT_RELEASED");
        
        // Map final grade information
        AssessmentDetailDTO.FinalGradeInfo finalGrade = new AssessmentDetailDTO.FinalGradeInfo();
        
        // Set final grade percentage - use override if available, otherwise will be set by computeDetailedAssessmentScores
        Double finalScoreOverride = convertToDouble(assessmentData.get("final_score_override_pct"));
        if (finalScoreOverride != null) {
            finalGrade.setGradePct1dp(finalScoreOverride);
            finalGrade.setIsManualOverride(true);
            finalGrade.setOverrideReason((String) assessmentData.get("final_score_override_reason"));
        } else {
            finalGrade.setIsManualOverride(false);
        }
        
        // Set consolidated feedback from all examiners
        String consolidatedFeedback = (String) assessmentData.get("consolidated_feedback");
        finalGrade.setConsolidatedFeedback(consolidatedFeedback);
        
        // Set admin notes
        String adminNotes = (String) assessmentData.get("admin_notes");
        finalGrade.setAdminNotes(adminNotes);
        
        // Convert percentage to letter grade (if applicable)
        if (finalGrade.getGradePct1dp() != null) {
            finalGrade.setGradeLetter(convertPercentageToLetterGrade(finalGrade.getGradePct1dp()));
        }
        
        detail.setFinalGrade(finalGrade);
        
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
        
        // Check assignment type from rawData
        String assignmentType = (String) rawData.get("assignment_type");

        List<AssessmentSummaryDTO.ExaminerSnapshot> examinerSnapshots = examinerMarkings.stream()
                .map(marking -> mapToExaminerSnapshot(marking, assignmentType, subjectId))
                .collect(Collectors.toList());
        assessment.setExaminers(examinerSnapshots);

        AssessmentSummaryDTO.ExaminerSummary summary = summariseExaminerSnapshots(
                examinerSnapshots, assessment.getExaminerSummary());
        assessment.setExaminerSummary(summary);

        if (assessment.getLastSubmittedAt() == null) {
            assessment.setLastSubmittedAt(latestNonNullTimestamp(
                    examinerSnapshots.stream()
                            .map(AssessmentSummaryDTO.ExaminerSnapshot::getSubmittedAt)
                            .collect(Collectors.toList())));
        }
        
        List<Double> submittedScores;
        if ("mixed".equalsIgnoreCase(assignmentType)) {
            // For mix rubric type, calculate final scores using individual and group weights
            submittedScores = examinerMarkings.stream()
                    .filter(marking -> "SUBMITTED".equals(marking.get("assessment_status")))
                    .map(marking -> calculateMixRubricFinalScore(marking, subjectId))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } else {
            // For non-mix types, use existing logic
            submittedScores = examinerMarkings.stream()
                    .filter(marking -> "SUBMITTED".equals(marking.get("assessment_status")))
                    .map(marking -> convertToDouble(marking.get("total_score")))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }
        
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
        
        // Get assignment type from the first examiner's rubric meta snapshot
        String assignmentType = null;
        if (!detail.getExaminers().isEmpty()) {
            ExaminerMarkDetailDTO firstExaminer = detail.getExaminers().get(0);
            // Extract assignment type from rubric meta if available
            assignmentType = extractAssignmentTypeFromRubricMeta(firstExaminer);
        }
        
        List<Double> submittedScores;
        if ("mixed".equalsIgnoreCase(assignmentType)) {
            // For mix rubric type, calculate final scores using individual and group weights
            Long subjectId = detail.getAssessment().getKey().getEntityId();
            submittedScores = detail.getExaminers().stream()
                    .filter(examiner -> "SUBMITTED".equals(examiner.getAssessmentStatus()))
                    .map(examiner -> calculateMixRubricFinalScoreFromExaminer(examiner, subjectId))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } else {
            // For non-mix types, use existing logic
            submittedScores = detail.getExaminers().stream()
                    .filter(examiner -> "SUBMITTED".equals(examiner.getAssessmentStatus()))
                    .map(ExaminerMarkDetailDTO::getExaminerScorePct1dp)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }
        
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
        
        // Update final grade information if not a manual override
        AssessmentDetailDTO.FinalGradeInfo finalGrade = detail.getFinalGrade();
        if (finalGrade != null && !Boolean.TRUE.equals(finalGrade.getIsManualOverride())) {
            finalGrade.setGradePct1dp(effectiveScore);
            if (effectiveScore != null) {
                finalGrade.setGradeLetter(convertPercentageToLetterGrade(effectiveScore));
            }
        }
    }

    private AssessmentSummaryDTO.ExaminerSnapshot mapToExaminerSnapshot(
            Map<String, Object> marking,
            String assignmentType,
            Long subjectId) {
        AssessmentSummaryDTO.ExaminerSnapshot snapshot = new AssessmentSummaryDTO.ExaminerSnapshot();
        snapshot.setSubmissionId((Long) marking.get("submission_id"));
        snapshot.setExaminerId((Long) marking.get("examiner_id"));
        snapshot.setExaminerName((String) marking.get("examiner_name"));

        String status = (String) marking.get("assessment_status");
        snapshot.setStatus(status);

        LocalDateTime submittedAt = (LocalDateTime) marking.get("submitted_at");
        snapshot.setSubmittedAt(formatDateTime(submittedAt));

        Double score;
        if ("mixed".equalsIgnoreCase(assignmentType)) {
            score = calculateMixRubricFinalScore(marking, subjectId);
        } else {
            score = convertToDouble(marking.get("total_score"));
        }
        snapshot.setScorePct1dp(score);

        return snapshot;
    }

    private AssessmentSummaryDTO.ExaminerSummary summariseExaminerSnapshots(
            List<AssessmentSummaryDTO.ExaminerSnapshot> examiners,
            AssessmentSummaryDTO.ExaminerSummary existingSummary) {
        AssessmentSummaryDTO.ExaminerSummary summary =
                existingSummary != null ? existingSummary : new AssessmentSummaryDTO.ExaminerSummary();

        int total = examiners.size();
        int submitted = (int) examiners.stream()
                .filter(snapshot -> "SUBMITTED".equalsIgnoreCase(snapshot.getStatus()))
                .count();
        int reopened = (int) examiners.stream()
                .filter(snapshot -> "REOPENED".equalsIgnoreCase(snapshot.getStatus()))
                .count();
        int draft = (int) examiners.stream()
                .filter(snapshot -> "DRAFT".equalsIgnoreCase(snapshot.getStatus()))
                .count();

        summary.setTotal(total);
        summary.setSubmitted(submitted);
        summary.setReopened(reopened);
        summary.setDraft(draft);
        summary.setPending(Math.max(total - submitted, 0));
        summary.setSubmittedRatio(total > 0 ? (double) submitted / total : 0.0);
        summary.setAllSubmitted(total > 0 && submitted == total && reopened == 0);
        summary.setAnyDraft(draft > 0);
        summary.setAnyReopened(reopened > 0);

        return summary;
    }

    private String latestNonNullTimestamp(List<String> timestamps) {
        if (timestamps == null || timestamps.isEmpty()) {
            return null;
        }

        return timestamps.stream()
                .filter(Objects::nonNull)
                .map(OffsetDateTime::parse)
                .max(Comparator.naturalOrder())
                .map(OffsetDateTime::toString)
                .orElse(null);
    }

    /**
     * Calculate final score for mix rubric type assessment
     * Combines individual and group scores based on their weights
     * @param examinerMarking The examiner marking data from database
     * @param subjectId The subject ID (group ID for mix type)
     * @return Final score percentage (0-100) or null if calculation fails
     */
    private Double calculateMixRubricFinalScore(Map<String, Object> examinerMarking, Long subjectId) {
        try {
            // Parse rubric meta info to get weights
            String rubricMetaJson = (String) examinerMarking.get("rubric_meta_snapshot");
            if (rubricMetaJson == null) {
                log.warn("No rubric meta snapshot found for examiner marking");
                return convertToDouble(examinerMarking.get("total_score"));
            }
            
            RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
            Double individualWeight = metaInfo.getIndividualWeight() != null ? metaInfo.getIndividualWeight() : 0.0;
            Double groupWeight = metaInfo.getGroupWeight() != null ? metaInfo.getGroupWeight() : 0.0;
            
            // Validate weights sum to 100
            if (Math.abs(individualWeight + groupWeight - 100.0) > 0.01) {
                log.warn("Mix rubric weights don't sum to 100: individual={}, group={}", individualWeight, groupWeight);
                return convertToDouble(examinerMarking.get("total_score"));
            }
            
            // Parse scores to separate individual and group scores
            String scoresJson = (String) examinerMarking.get("scores_json");
            String rubricsInfoJson = (String) examinerMarking.get("rubrics_info_snapshot");
            
            if (scoresJson == null || rubricsInfoJson == null) {
                log.warn("Missing scores or rubrics info for mix rubric calculation");
                return convertToDouble(examinerMarking.get("total_score"));
            }
            
            // Calculate individual and group scores separately
            Double individualScore = calculateIndividualScore(metaInfo.getIndividualRubrics(), scoresJson);
            Double groupScore = calculateGroupScore(metaInfo.getGroupRubrics(), scoresJson);
            
            // Calculate final score using weights
            Double finalScore = 0.0;
            if (individualWeight > 0 && individualScore != null) {
                finalScore += (individualScore * individualWeight / 100.0);
            }
            if (groupWeight > 0 && groupScore != null) {
                finalScore += (groupScore * groupWeight / 100.0);
            }
            
            log.debug("Mix rubric final score calculation: individual={}*{}/100 + group={}*{}/100 = {}", 
                    individualScore, individualWeight, groupScore, groupWeight, finalScore);
            
            return finalScore;
            
        } catch (Exception e) {
            log.error("Error calculating mix rubric final score", e);
            // Fallback to total_score if calculation fails
            return convertToDouble(examinerMarking.get("total_score"));
        }
    }
    
    /**
     * Calculate final score for mix rubric type from ExaminerMarkDetailDTO
     * @param examiner The examiner detail DTO
     * @param subjectId The subject ID (group ID for mix type)
     * @return Final score percentage (0-100) or null if calculation fails
     */
    private Double calculateMixRubricFinalScoreFromExaminer(ExaminerMarkDetailDTO examiner, Long subjectId) {
        // For now, return the examiner score as-is since we don't have access to rubric meta in DTO
        // TODO: Enhance ExaminerMarkDetailDTO to include rubric meta info for proper mix calculation
        return examiner.getExaminerScorePct1dp();
    }
    
    /**
     * Extract assignment type from examiner's rubric meta snapshot
     * @param examiner The examiner detail DTO
     * @return Assignment type or null if not found
     */
    private String extractAssignmentTypeFromRubricMeta(ExaminerMarkDetailDTO examiner) {
        // For now, we can't extract this from the current DTO structure
        // TODO: Enhance to properly extract assignment type
        return null;
    }
    
    /**
     * Calculate individual score from individual rubrics and scores
     * @param individualRubrics The individual rubric criteria
     * @param scoresJson The scores JSON string
     * @return Individual score percentage (0-100) or null if calculation fails
     */
    private Double calculateIndividualScore(List<RubricsInfoDto> individualRubrics, String scoresJson) {
        if (individualRubrics == null || individualRubrics.isEmpty()) {
            return null;
        }
        
        try {
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(
                scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {});
            
            return computeScoreForRubrics(individualRubrics, scores);
        } catch (Exception e) {
            log.error("Error calculating individual score", e);
            return null;
        }
    }
    
    /**
     * Calculate group score from group rubrics and scores
     * @param groupRubrics The group rubric criteria
     * @param scoresJson The scores JSON string
     * @return Group score percentage (0-100) or null if calculation fails
     */
    private Double calculateGroupScore(List<RubricsInfoDto> groupRubrics, String scoresJson) {
        if (groupRubrics == null || groupRubrics.isEmpty()) {
            return null;
        }
        
        try {
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(
                scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {});
            
            return computeScoreForRubrics(groupRubrics, scores);
        } catch (Exception e) {
            log.error("Error calculating group score", e);
            return null;
        }
    }
    
    /**
     * Compute score for a set of rubrics and matching score items
     * @param rubrics The rubric criteria
     * @param scores The score items
     * @return Computed score percentage (0-100)
     */
    private Double computeScoreForRubrics(List<RubricsInfoDto> rubrics, List<SaveAssessmentDraftRequestDTO.ScoreItem> scores) {
        double total = 0.0;
        double totalWeight = 0.0;
        
        for (RubricsInfoDto rubric : rubrics) {
            double weight = rubric.getWeight() != null ? rubric.getWeight() : 0.0;
            totalWeight += weight;
            
            SaveAssessmentDraftRequestDTO.ScoreItem matchedScore = scores.stream()
                    .filter(s -> rubric.getDescription() != null && 
                               rubric.getDescription().trim().equalsIgnoreCase(
                                   s.getDescription() != null ? s.getDescription().trim() : ""))
                    .findFirst()
                    .orElse(null);
            
            double normalizedScore = 0.0;
            if (matchedScore != null && matchedScore.getInputPoints() != null) {
                normalizedScore = Math.max(0.0, Math.min(100.0, matchedScore.getInputPoints()));
            }
            
            total += normalizedScore * weight / 100.0;
        }
        
        // If total weight is 0, return 0; otherwise normalize to percentage
        return totalWeight > 0 ? (total / totalWeight) * 100.0 : 0.0;
    }

    /**
     * Convert percentage to letter grade based on common Australian university grading scale
     * @param percentage The percentage score (0-100)
     * @return Letter grade (HD, D, C, P, F)
     */
    private String convertPercentageToLetterGrade(Double percentage) {
        if (percentage == null) return null;
        
        if (percentage >= 80) return "HD";  // High Distinction
        if (percentage >= 70) return "D";   // Distinction
        if (percentage >= 60) return "C";   // Credit
        if (percentage >= 50) return "P";   // Pass
        return "F";                         // Fail
    }

    private Integer convertToInteger(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ex) {
            log.warn("Unable to convert value [{}] to Integer", value);
            return 0;
        }
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

    @Override
    public ExaminerScoringDTO getIndividualExaminerScoring(Long subjectId, Long assignmentId, Long studentId) {
        // Get basic subject and assignment info
        Map<String, Object> subjectData = adminResultsMapper.getIndividualExaminerScoring(assignmentId, studentId);
        if (subjectData == null || subjectData.isEmpty()) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
        
        // Get all examiner markings for this student
        List<Map<String, Object>> examinerData = adminResultsMapper.getIndividualExaminerMarkings(assignmentId, studentId);
        
        // Build response DTO
        return buildExaminerScoringDTO(subjectData, examinerData);
    }

    @Override
    public ExaminerScoringDTO getGroupExaminerScoring(Long subjectId, Long assignmentId, Long groupId) {
        // Get basic subject and assignment info
        Map<String, Object> subjectData = adminResultsMapper.getGroupExaminerScoring(assignmentId, groupId);
        if (subjectData == null || subjectData.isEmpty()) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        // Get all examiner markings for this group
        List<Map<String, Object>> examinerData = adminResultsMapper.getGroupExaminerMarkings(assignmentId, groupId);
        
        // Build response DTO
        return buildExaminerScoringDTO(subjectData, examinerData);
    }

    private ExaminerScoringDTO buildExaminerScoringDTO(Map<String, Object> subjectData, List<Map<String, Object>> examinerData) {
        ExaminerScoringDTO dto = new ExaminerScoringDTO();
        
        // Set assignment info
        ExaminerScoringDTO.AssignmentInfo assignment = new ExaminerScoringDTO.AssignmentInfo();
        assignment.setId((Long) subjectData.get("assignment_id"));
        assignment.setName((String) subjectData.get("assignment_name"));
        dto.setAssignment(assignment);
        
        // Set subject info
        ExaminerScoringDTO.SubjectInfo subject = new ExaminerScoringDTO.SubjectInfo();
        subject.setId((Long) subjectData.get("subject_id"));
        subject.setName((String) subjectData.get("subject_name"));
        subject.setType((String) subjectData.get("subject_type"));
        if (subjectData.get("member_count") != null) {
            subject.setMemberCount(((Number) subjectData.get("member_count")).intValue());
        }
        dto.setSubject(subject);
        
        // Convert examiner data to DTOs
        List<ExaminerMarkDetailDTO> examiners = examinerData.stream()
                .map(this::mapToExaminerMarkDetail)
                .collect(Collectors.toList());
        dto.setExaminers(examiners);
        
        // Compute score summary
        ExaminerScoringDTO.ScoreSummary scores = computeScoreSummary(examinerData);
        dto.setScores(scores);
        
        return dto;
    }

    private ExaminerScoringDTO.ScoreSummary computeScoreSummary(List<Map<String, Object>> examinerData) {
        ExaminerScoringDTO.ScoreSummary summary = new ExaminerScoringDTO.ScoreSummary();
        
        // Check if this is a mix rubric assignment
        boolean isMixRubric = false;
        if (!examinerData.isEmpty()) {
            try {
                String rubricMetaJson = (String) examinerData.get(0).get("rubric_meta_snapshot");
                if (rubricMetaJson != null) {
                    RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
                    Double individualWeight = metaInfo.getIndividualWeight() != null ? metaInfo.getIndividualWeight() : 0.0;
                    Double groupWeight = metaInfo.getGroupWeight() != null ? metaInfo.getGroupWeight() : 0.0;
                    isMixRubric = (individualWeight > 0 && groupWeight > 0);
                }
            } catch (Exception e) {
                log.warn("Could not parse rubric meta info to check for mix rubric type: {}", e.getMessage());
            }
        }
        
        List<Double> submittedScores;
        if (isMixRubric) {
            // For mix rubric type, calculate final scores using individual and group weights
            submittedScores = examinerData.stream()
                    .filter(marking -> "SUBMITTED".equals(marking.get("assessment_status")))
                    .map(marking -> calculateMixRubricFinalScore(marking, null)) // subjectId not needed for this calculation
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } else {
            // For non-mix types, use existing logic
            submittedScores = examinerData.stream()
                    .filter(marking -> "SUBMITTED".equals(marking.get("assessment_status")))
                    .map(marking -> convertToDouble(marking.get("total_score")))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }
        
        Double averageScore = submittedScores.isEmpty() ? null : 
                submittedScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        
        summary.setAverageScorePct1dp(averageScore);
        summary.setSubmittedCount(submittedScores.size());
        summary.setTotalCount(examinerData.size());
        
        // Check for manual override - use the first one found (they should all be the same)
        Map<String, Object> firstWithOverride = examinerData.stream()
                .filter(data -> data.get("final_score_override") != null)
                .findFirst()
                .orElse(null);
        
        if (firstWithOverride != null) {
            ExaminerScoringDTO.ScoreSummary.ManualOverride override = new ExaminerScoringDTO.ScoreSummary.ManualOverride();
            override.setValuePct1dp(convertToDouble(firstWithOverride.get("final_score_override")));
            override.setReason((String) firstWithOverride.get("override_reason"));
            override.setOverrideAt(formatDateTime((LocalDateTime) firstWithOverride.get("override_at")));
            override.setOverrideByUserId((Long) firstWithOverride.get("override_by_user_id"));
            summary.setManualOverride(override);
            
            // Use override as effective score
            summary.setEffectiveFinalScorePct1dp(override.getValuePct1dp());
        } else {
            // Use average as effective score
            summary.setEffectiveFinalScorePct1dp(averageScore);
        }
        
        return summary;
    }

    @Override
    public PageResult<AdminSessionResultsDTO.SessionItem> getSessionsForAssignment(
            Long subjectId, Long assignmentId, Integer pageNum, Integer pageSize, String searchQuery) {
        
        // Calculate offset
        int offset = (pageNum - 1) * pageSize;
        
        // Get total count
        Integer total = adminResultsMapper.countSessionsForAssignment(assignmentId, searchQuery);
        
        // Get session data
        List<Map<String, Object>> rawData = adminResultsMapper.getSessionsForAssignment(
                assignmentId, searchQuery, offset, pageSize);
        
        // Map to DTOs
        List<AdminSessionResultsDTO.SessionItem> sessions = rawData.stream()
                .map(this::mapToSessionItem)
                .collect(Collectors.toList());
        
        return new PageResult<>(pageNum, pageSize, total, sessions);
    }

    @Override
    public PageResult<AdminSessionParticipantsDTO.ParticipantItem> getParticipantsForSession(
            Long subjectId, Long assignmentId, Long sessionId, Integer pageNum, Integer pageSize,
            String type, String status, String searchQuery) {
        
        // If type is 'ALL', determine actual type based on assignment configuration
        // This prevents mixing GROUP and INDIVIDUAL participants in the same result
        if ("ALL".equals(type)) {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment != null) {
                String assignmentType = assignment.getType();
                if ("individual".equalsIgnoreCase(assignmentType)) {
                    type = "INDIVIDUAL";
                    log.debug("Auto-determined type as INDIVIDUAL based on assignment type");
                } else if ("group".equalsIgnoreCase(assignmentType) || "mixed".equalsIgnoreCase(assignmentType)) {
                    // For both GROUP and MIXED assignments, participants are groups
                    type = "GROUP";
                    log.debug("Auto-determined type as GROUP based on assignment type: {}", assignmentType);
                }
            }
        }
        
        // Calculate offset
        int offset = (pageNum - 1) * pageSize;
        
        // Get total count
        Integer total = adminResultsMapper.countParticipantsForSession(
                assignmentId, sessionId, type, status, searchQuery);
        
        // Get participant data
        List<Map<String, Object>> rawData = adminResultsMapper.getParticipantsForSession(
                assignmentId, sessionId, type, status, searchQuery, offset, pageSize);
        
        // Map to DTOs
        List<AdminSessionParticipantsDTO.ParticipantItem> participants = rawData.stream()
                .map(this::mapToParticipantItem)
                .collect(Collectors.toList());
        
        return new PageResult<>(pageNum, pageSize, total, participants);
    }

    @Override
    public AdminParticipantDetailDTO getGroupDetailWithExaminers(
            Long subjectId, Long assignmentId, Long groupId) {
        
        // Get group detail data
        Map<String, Object> detailData = adminResultsMapper.getGroupDetailWithExaminers(assignmentId, groupId);
        if (detailData == null || detailData.isEmpty()) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        // Get all examiner markings for this group
        List<Map<String, Object>> examinerData = adminResultsMapper.getGroupExaminerMarkings(assignmentId, groupId);
        
        // Build complete response
        return buildParticipantDetailDTO(detailData, examinerData, "GROUP");
    }

    @Override
    public AdminParticipantDetailDTO getIndividualDetailWithExaminers(
            Long subjectId, Long assignmentId, Long studentId) {
        
        // Get individual detail data
        Map<String, Object> detailData = adminResultsMapper.getIndividualDetailWithExaminers(assignmentId, studentId);
        if (detailData == null || detailData.isEmpty()) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
        
        // Get all examiner markings for this individual
        List<Map<String, Object>> examinerData = adminResultsMapper.getIndividualExaminerMarkings(assignmentId, studentId);
        
        // Build complete response
        return buildParticipantDetailDTO(detailData, examinerData, "INDIVIDUAL");
    }

    // Helper methods for new endpoints

    private AdminSessionResultsDTO.SessionItem mapToSessionItem(Map<String, Object> data) {
        AdminSessionResultsDTO.SessionItem item = new AdminSessionResultsDTO.SessionItem();
        
        item.setSessionId((Long) data.get("session_id"));
        item.setTimezone("Australia/Melbourne");
        
        LocalDateTime startAt = (LocalDateTime) data.get("start_at");
        LocalDateTime endAt = (LocalDateTime) data.get("end_at");
        if (startAt != null) {
            item.setStart(formatDateTime(startAt));
        }
        if (endAt != null) {
            item.setEnd(formatDateTime(endAt));
        }
        
        Long venueId = (Long) data.get("venue_id");
        String venueName = (String) data.get("venue_name");
        if (venueId != null) {
            AdminSessionResultsDTO.SessionItem.VenueInfo venue = 
                    new AdminSessionResultsDTO.SessionItem.VenueInfo();
            venue.setVenueId(venueId);
            venue.setName(venueName);
            item.setVenue(venue);
        }

        Long participantCount = (Long) data.get("participant_count");
        item.setParticipantCount(participantCount != null ? participantCount : 0);
        
        return item;
    }

    private AdminSessionParticipantsDTO.ParticipantItem mapToParticipantItem(Map<String, Object> data) {
        AdminSessionParticipantsDTO.ParticipantItem item = 
                new AdminSessionParticipantsDTO.ParticipantItem();
        
        String subjectType = (String) data.get("subject_type");
        
        if ("GROUP".equals(subjectType)) {
            item.setGroupId((Long) data.get("group_id"));
            item.setGroupName((String) data.get("group_name"));

            Long memberCount = (Long) data.get("member_count");
            item.setMemberCount(memberCount);
            
            // Parse members JSON if available
            String membersJson = (String) data.get("members_json");
            if (membersJson != null && !membersJson.trim().isEmpty()) {
                try {
                    List<Map<String, Object>> membersList = objectMapper.readValue(
                            membersJson, new TypeReference<List<Map<String, Object>>>() {});
                    List<AdminSessionParticipantsDTO.ParticipantItem.MemberInfo> members = 
                            membersList.stream().map(m -> {
                                AdminSessionParticipantsDTO.ParticipantItem.MemberInfo member = 
                                        new AdminSessionParticipantsDTO.ParticipantItem.MemberInfo();
                                member.setStudentId(((Number) m.get("studentId")).longValue());
                                member.setName((String) m.get("name"));
                                return member;
                            }).collect(Collectors.toList());
                    item.setMembers(members);
                } catch (Exception e) {
                    log.warn("Failed to parse members JSON: {}", e.getMessage());
                }
            }
        } else if ("INDIVIDUAL".equals(subjectType)) {
            item.setStudentId((Long) data.get("student_id"));
            item.setName((String) data.get("student_name"));
            item.setStudentNumber((String) data.get("student_number"));
        }
        
        item.setReleaseStatus((String) data.getOrDefault("release_status", "NOT_RELEASED"));
        
        return item;
    }

    private AdminParticipantDetailDTO buildParticipantDetailDTO(
            Map<String, Object> detailData, List<Map<String, Object>> examinerData, String participantType) {
        
        AdminParticipantDetailDTO dto = new AdminParticipantDetailDTO();
        
        // Set assignment info
        AdminParticipantDetailDTO.AssignmentInfo assignment = 
                new AdminParticipantDetailDTO.AssignmentInfo();
        assignment.setId((Long) detailData.get("assignment_id"));
        assignment.setName((String) detailData.get("assignment_name"));
        assignment.setType((String) detailData.get("assignment_type"));
        dto.setAssignment(assignment);
        
        // Set session info
        AdminParticipantDetailDTO.SessionInfo session = 
                new AdminParticipantDetailDTO.SessionInfo();
        session.setId((Long) detailData.get("session_id"));
        session.setTimezone("Australia/Melbourne");
        
        LocalDateTime startAt = (LocalDateTime) detailData.get("session_start_at");
        LocalDateTime endAt = (LocalDateTime) detailData.get("session_end_at");
        if (startAt != null) {
            session.setStart(formatDateTime(startAt));
        }
        if (endAt != null) {
            session.setEnd(formatDateTime(endAt));
        }
        
        Long venueId = (Long) detailData.get("venue_id");
        String venueName = (String) detailData.get("venue_name");
        if (venueId != null) {
            AdminParticipantDetailDTO.SessionInfo.VenueInfo venue = 
                    new AdminParticipantDetailDTO.SessionInfo.VenueInfo();
            venue.setVenueId(venueId);
            venue.setName(venueName);
            session.setVenue(venue);
        }
        dto.setSession(session);
        
        // Set participant info
        AdminParticipantDetailDTO.ParticipantInfo participant = 
                new AdminParticipantDetailDTO.ParticipantInfo();
        participant.setType(participantType);
        
        if ("GROUP".equals(participantType)) {
            participant.setGroupId((Long) detailData.get("group_id"));
            participant.setGroupName((String) detailData.get("group_name"));
            participant.setMemberCount(((Number) detailData.get("member_count")).intValue());
            
            // Parse members JSON
            String membersJson = (String) detailData.get("members_json");
            if (membersJson != null && !membersJson.trim().isEmpty()) {
                try {
                    List<Map<String, Object>> membersList = objectMapper.readValue(
                            membersJson, new TypeReference<List<Map<String, Object>>>() {});
                    List<AdminParticipantDetailDTO.ParticipantInfo.MemberInfo> members = 
                            membersList.stream().map(m -> {
                                AdminParticipantDetailDTO.ParticipantInfo.MemberInfo member = 
                                        new AdminParticipantDetailDTO.ParticipantInfo.MemberInfo();
                                member.setStudentId(((Number) m.get("studentId")).longValue());
                                member.setName((String) m.get("name"));
                                return member;
                            }).collect(Collectors.toList());
                    participant.setMembers(members);
                } catch (Exception e) {
                    log.warn("Failed to parse members JSON: {}", e.getMessage());
                }
            }
        } else {
            participant.setStudentId((Long) detailData.get("student_id"));
            participant.setName((String) detailData.get("student_name"));
            participant.setStudentNumber((String) detailData.get("student_number"));
        }
        
        participant.setReleaseStatus((String) detailData.getOrDefault("release_status", "NOT_RELEASED"));
        dto.setParticipant(participant);
        
        // Parse rubric snapshot
        AdminParticipantDetailDTO.RubricSnapshot rubricSnapshot = parseRubricSnapshot(detailData);
        dto.setRubricSnapshot(rubricSnapshot);
        
        // Map examiner submissions and aggregate by examiner_id
        // For MIXED assignments, an examiner may have multiple submissions (group + individual per student)
        // We need to aggregate these into a single ExaminerSubmission per examiner
        Map<Long, List<Map<String, Object>>> examinerDataByExaminer = examinerData.stream()
                .collect(Collectors.groupingBy(ed -> (Long) ed.get("examiner_id"), 
                        LinkedHashMap::new, Collectors.toList()));
        
        List<AdminParticipantDetailDTO.ExaminerSubmission> examiners = new ArrayList<>();
        for (Map.Entry<Long, List<Map<String, Object>>> entry : examinerDataByExaminer.entrySet()) {
            List<Map<String, Object>> examinerSubmissions = entry.getValue();
            
            // For aggregation, prioritize GROUP/MIX submissions for main data, 
            // but collect all rubric scores from all submissions
            Map<String, Object> primarySubmission = examinerSubmissions.stream()
                    .filter(ed -> "GROUP".equals(ed.get("subject_type")) || "MIX".equals(ed.get("subject_type")))
                    .findFirst()
                    .orElse(examinerSubmissions.get(0));
            
            AdminParticipantDetailDTO.ExaminerSubmission aggregatedSubmission = 
                    mapToExaminerSubmission(primarySubmission, participantType);
            
            // Collect all submission IDs for this examiner
            List<Long> submissionIds = examinerSubmissions.stream()
                    .map(ed -> (Long) ed.get("submission_id"))
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            aggregatedSubmission.setSubmissionIds(submissionIds);
            
            // If there are multiple submissions for this examiner, merge the rubric scores
            if (examinerSubmissions.size() > 1) {
                AdminParticipantDetailDTO.ExaminerSubmission.RubricScores mergedScores = 
                        mergeRubricScoresFromMultipleSubmissions(examinerSubmissions, participantType);
                aggregatedSubmission.setRubricScores(mergedScores);
            }
            
            examiners.add(aggregatedSubmission);
        }
        dto.setExaminers(examiners);
        
        // Calculate final scores for each member (for GROUP type)
        if ("GROUP".equals(participantType) && participant.getMembers() != null) {
            // Check if this is a MIXED assignment
            boolean isMixed = rubricSnapshot != null && 
                    rubricSnapshot.getGroupWeight() != null && rubricSnapshot.getGroupWeight() > 0 &&
                    rubricSnapshot.getIndividualWeight() != null && rubricSnapshot.getIndividualWeight() > 0;
            
            if (isMixed) {
                // For MIXED assignments: calculate group average and individual average separately, then combine
                
                // First, calculate average group score across all examiners
                Double avgGroupScore = calculateAverageGroupScore(examiners, rubricSnapshot.getGroupRubrics());
                
                // Then, for each member, calculate their average individual score and final score
                for (AdminParticipantDetailDTO.ParticipantInfo.MemberInfo member : participant.getMembers()) {
                    Double avgIndividualScore = calculateAverageIndividualScore(
                            member.getStudentId(), examiners, rubricSnapshot.getIndividualRubrics());
                    
                    // Calculate final score using weights
                    if (avgGroupScore != null || avgIndividualScore != null) {
                        double finalScore = 0.0;
                        if (avgGroupScore != null && rubricSnapshot.getGroupWeight() != null) {
                            finalScore += (avgGroupScore * rubricSnapshot.getGroupWeight()) / 100.0;
                        }
                        if (avgIndividualScore != null && rubricSnapshot.getIndividualWeight() != null) {
                            finalScore += (avgIndividualScore * rubricSnapshot.getIndividualWeight()) / 100.0;
                        }
                        member.setFinalScore(finalScore);
                    }
                }
            } else {
                // For non-MIXED assignments, just use the examiner's total score for each member
                // (all members should have the same score for GROUP-only assignments)
                List<Double> totalScores = examiners.stream()
                        .filter(e -> "SUBMITTED".equals(e.getAssessmentStatus()))
                        .map(AdminParticipantDetailDTO.ExaminerSubmission::getTotalScore)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                
                if (!totalScores.isEmpty()) {
                    double avgScore = totalScores.stream()
                            .mapToDouble(Double::doubleValue).average().orElse(0.0);
                    
                    // All members get the same score for GROUP-only assignments
                    for (AdminParticipantDetailDTO.ParticipantInfo.MemberInfo member : participant.getMembers()) {
                        member.setFinalScore(avgScore);
                    }
                }
            }
        }
        
        return dto;
    }

    /**
     * Calculate average group score across all submitted examiners.
     * Each examiner's group score is calculated with proper weighting, then averaged.
     */
    private Double calculateAverageGroupScore(
            List<AdminParticipantDetailDTO.ExaminerSubmission> examiners,
            List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> groupRubrics) {
        
        if (groupRubrics == null || groupRubrics.isEmpty()) {
            return null;
        }
        
        List<Double> examinerGroupScores = new ArrayList<>();
        
        for (AdminParticipantDetailDTO.ExaminerSubmission examiner : examiners) {
            if (!"SUBMITTED".equals(examiner.getAssessmentStatus())) {
                continue;
            }
            
            if (examiner.getRubricScores() == null || examiner.getRubricScores().getGroup() == null) {
                continue;
            }
            
            // Calculate this examiner's group score
            Double groupScore = calculateGroupScoreFromCriteria(
                    examiner.getRubricScores().getGroup(), groupRubrics);
            
            if (groupScore != null) {
                examinerGroupScores.add(groupScore);
            }
        }
        
        // Return average across all examiners
        if (examinerGroupScores.isEmpty()) {
            return null;
        }
        
        return examinerGroupScores.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }
    
    /**
     * Calculate average individual score for a specific student across all submitted examiners.
     * Each examiner's individual score for this student is calculated with proper weighting, then averaged.
     */
    private Double calculateAverageIndividualScore(
            Long studentId,
            List<AdminParticipantDetailDTO.ExaminerSubmission> examiners,
            List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> individualRubrics) {
        
        if (individualRubrics == null || individualRubrics.isEmpty()) {
            return null;
        }
        
        List<Double> examinerIndividualScores = new ArrayList<>();
        
        for (AdminParticipantDetailDTO.ExaminerSubmission examiner : examiners) {
            if (!"SUBMITTED".equals(examiner.getAssessmentStatus())) {
                continue;
            }
            
            if (examiner.getRubricScores() == null || examiner.getRubricScores().getIndividual() == null) {
                continue;
            }
            
            // Calculate this examiner's individual score for this student
            Double individualScore = calculateIndividualScoreFromCriteria(
                    studentId, examiner.getRubricScores().getIndividual(), individualRubrics);
            
            if (individualScore != null) {
                examinerIndividualScores.add(individualScore);
            }
        }
        
        // Return average across all examiners
        if (examinerIndividualScores.isEmpty()) {
            return null;
        }
        
        return examinerIndividualScores.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }
    
    /**
     * Calculate group score from group rubric scores with proper weighting
     */
    private Double calculateGroupScoreFromCriteria(
            List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore> groupScores,
            List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> groupRubrics) {
        
        if (groupScores == null || groupScores.isEmpty()) {
            return null;
        }
        
        double totalPoints = 0.0;
        double totalWeight = 0.0;
        
        for (AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion rubric : groupRubrics) {
            Double weight = rubric.getWeight();
            if (weight == null) continue;
            
            // Find matching score
            AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore matchingScore = 
                    groupScores.stream()
                            .filter(gs -> rubric.getDescription() != null && 
                                    rubric.getDescription().equals(gs.getCriterionDescription()))
                            .findFirst().orElse(null);
            
            if (matchingScore != null && matchingScore.getPointsAwarded() != null) {
                totalWeight += weight;
                // Points are already normalized to 0-100 scale
                totalPoints += (matchingScore.getPointsAwarded() * weight) / 100.0;
            }
        }
        
        return totalWeight > 0 ? (totalPoints / totalWeight) * 100.0 : null;
    }
    
    /**
     * Calculate individual score for a specific student from individual rubric scores with proper weighting
     */
    private Double calculateIndividualScoreFromCriteria(
            Long studentId,
            List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore> individualScores,
            List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> individualRubrics) {
        
        if (individualScores == null || individualScores.isEmpty()) {
            return null;
        }
        
        // Filter scores for this specific student
        List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore> studentScores = 
                individualScores.stream()
                        .filter(is -> studentId.equals(is.getStudentId()))
                        .collect(Collectors.toList());
        
        if (studentScores.isEmpty()) {
            return null;
        }
        
        double totalPoints = 0.0;
        double totalWeight = 0.0;
        
        for (AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion rubric : individualRubrics) {
            Double weight = rubric.getWeight();
            if (weight == null) continue;
            
            // Find matching score for this student
            AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore matchingScore = 
                    studentScores.stream()
                            .filter(is -> rubric.getDescription() != null && 
                                    rubric.getDescription().equals(is.getCriterionDescription()))
                            .findFirst().orElse(null);
            
            if (matchingScore != null && matchingScore.getPointsAwarded() != null) {
                totalWeight += weight;
                // Points are already normalized to 0-100 scale
                totalPoints += (matchingScore.getPointsAwarded() * weight) / 100.0;
            }
        }
        
        return totalWeight > 0 ? (totalPoints / totalWeight) * 100.0 : null;
    }

    private AdminParticipantDetailDTO.RubricSnapshot parseRubricSnapshot(Map<String, Object> detailData) {
        AdminParticipantDetailDTO.RubricSnapshot snapshot = 
                new AdminParticipantDetailDTO.RubricSnapshot();
        
        try {
            String rubricMetaJson = (String) detailData.get("rubric_meta_snapshot");
            if (rubricMetaJson != null) {
                RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
                snapshot.setName(metaInfo.getName());
                snapshot.setDescription(metaInfo.getDescription());
                snapshot.setTotalPoints(metaInfo.getTotalPoints());
                snapshot.setWeightBasis(metaInfo.getWeightBasis());
                snapshot.setGroupWeight(metaInfo.getGroupWeight());
                snapshot.setIndividualWeight(metaInfo.getIndividualWeight());
                
                // Parse group rubrics
                if (metaInfo.getGroupRubrics() != null) {
                    List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> groupRubrics = 
                            metaInfo.getGroupRubrics().stream()
                                    .map(this::mapToRubricSnapshotCriterion)
                                    .collect(Collectors.toList());
                    snapshot.setGroupRubrics(groupRubrics);
                }
                
                // Parse individual rubrics
                if (metaInfo.getIndividualRubrics() != null) {
                    List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion> individualRubrics = 
                            metaInfo.getIndividualRubrics().stream()
                                    .map(this::mapToRubricSnapshotCriterion)
                                    .collect(Collectors.toList());
                    snapshot.setIndividualRubrics(individualRubrics);
                }
            }
        } catch (Exception e) {
            log.error("Error parsing rubric snapshot", e);
        }
        
        return snapshot;
    }

    private AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion mapToRubricSnapshotCriterion(
            RubricsInfoDto rubricInfo) {
        AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion criterion = 
                new AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion();
        
        criterion.setDescription(rubricInfo.getDescription());
        criterion.setWeight(rubricInfo.getWeight());
        criterion.setScaleType(rubricInfo.getScaleType() != null ? rubricInfo.getScaleType() : "points");
        
        if (rubricInfo.getPerformanceLevel() != null) {
            List<AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion.PerformanceLevel> levels = 
                    rubricInfo.getPerformanceLevel().stream().map(perf -> {
                        AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion.PerformanceLevel level = 
                                new AdminParticipantDetailDTO.RubricSnapshot.RubricCriterion.PerformanceLevel();
                        level.setLabel(perf.getDescription());
                        level.setMinPoints(perf.getStartPoint());
                        level.setMaxPoints(perf.getEndPoint());
                        // PredefinedComments might not exist in PerformanceDto, use empty list
                        level.setPredefinedComments(new ArrayList<>());
                        return level;
                    }).collect(Collectors.toList());
            criterion.setPerformanceLevels(levels);
        }
        
        return criterion;
    }

    private AdminParticipantDetailDTO.ExaminerSubmission mapToExaminerSubmission(
            Map<String, Object> examinerData, String participantType) {
        
        AdminParticipantDetailDTO.ExaminerSubmission submission = 
                new AdminParticipantDetailDTO.ExaminerSubmission();
        
        // Note: submissionIds will be set in buildParticipantDetailDTO to include all related submissions
        submission.setExaminerId((Long) examinerData.get("examiner_id"));
        submission.setExaminerName((String) examinerData.get("examiner_name"));
        submission.setAssessmentStatus((String) examinerData.get("assessment_status"));
        submission.setSubmittedAt(formatDateTime((LocalDateTime) examinerData.get("submitted_at")));
        submission.setOverallFeedback((String) examinerData.get("overall_feedback"));
        submission.setTotalScore(convertToDouble(examinerData.get("total_score")));
        
        // Parse rubric scores
        AdminParticipantDetailDTO.ExaminerSubmission.RubricScores rubricScores = 
                parseRubricScores(examinerData, participantType);
        submission.setRubricScores(rubricScores);
        
        return submission;
    }

    private AdminParticipantDetailDTO.ExaminerSubmission.RubricScores mergeRubricScoresFromMultipleSubmissions(
            List<Map<String, Object>> examinerSubmissions, String participantType) {
        
        AdminParticipantDetailDTO.ExaminerSubmission.RubricScores mergedScores = 
                new AdminParticipantDetailDTO.ExaminerSubmission.RubricScores();
        
        List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore> allGroupScores = 
                new ArrayList<>();
        List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore> allIndividualScores = 
                new ArrayList<>();
        
        // Parse and merge scores from all submissions
        for (Map<String, Object> submission : examinerSubmissions) {
            AdminParticipantDetailDTO.ExaminerSubmission.RubricScores scores = 
                    parseRubricScores(submission, participantType);
            
            if (scores.getGroup() != null) {
                allGroupScores.addAll(scores.getGroup());
            }
            if (scores.getIndividual() != null) {
                allIndividualScores.addAll(scores.getIndividual());
            }
        }
        
        mergedScores.setGroup(allGroupScores);
        mergedScores.setIndividual(allIndividualScores);
        
        return mergedScores;
    }

    private AdminParticipantDetailDTO.ExaminerSubmission.RubricScores parseRubricScores(
            Map<String, Object> examinerData, String participantType) {
        
        AdminParticipantDetailDTO.ExaminerSubmission.RubricScores rubricScores = 
                new AdminParticipantDetailDTO.ExaminerSubmission.RubricScores();
        
        try {
            String scoresJson = (String) examinerData.get("scores_json");
            String rubricMetaJson = (String) examinerData.get("rubric_meta_snapshot");
            
            if (scoresJson == null || scoresJson.trim().isEmpty()) {
                log.debug("scores_json is null or empty for examiner {}", examinerData.get("examiner_id"));
                rubricScores.setGroup(new ArrayList<>());
                rubricScores.setIndividual(new ArrayList<>());
                return rubricScores;
            }
            
            if (rubricMetaJson == null) {
                log.debug("rubric_meta_snapshot is null for examiner {}", examinerData.get("examiner_id"));
                rubricScores.setGroup(new ArrayList<>());
                rubricScores.setIndividual(new ArrayList<>());
                return rubricScores;
            }
            
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scoreItems = objectMapper.readValue(
                    scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {});
            
            RubricMetaInfo metaInfo = objectMapper.readValue(rubricMetaJson, RubricMetaInfo.class);
            
            log.debug("Parsing rubric scores: participantType={}, scoreItems.size={}, groupRubrics={}, individualRubrics={}", 
                    participantType, scoreItems.size(), 
                    metaInfo.getGroupRubrics() != null ? metaInfo.getGroupRubrics().size() : 0,
                    metaInfo.getIndividualRubrics() != null ? metaInfo.getIndividualRubrics().size() : 0);
            
            // Separate group and individual scores
            List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore> groupScores = 
                    new ArrayList<>();
            List<AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore> individualScores = 
                    new ArrayList<>();
            
            // Process each score item based on its type field
            for (SaveAssessmentDraftRequestDTO.ScoreItem scoreItem : scoreItems) {
                String scoreType = scoreItem.getType();
                
                // If type is not specified, infer from context
                if (scoreType == null || scoreType.isEmpty()) {
                    // For non-MIXED assignments, check if it has studentId to determine type
                    if (scoreItem.getStudentId() != null) {
                        scoreType = "INDIVIDUAL";
                    } else {
                        scoreType = "GROUP";
                    }
                }
                
                if ("GROUP".equals(scoreType)) {
                    // Process as group score
                    AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore groupScore = 
                            new AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.GroupScore();
                    groupScore.setCriterionDescription(scoreItem.getDescription());
                    if (scoreItem.getSelectedLevel() != null) {
                        groupScore.setSelectedLevel(scoreItem.getSelectedLevel().getDescription());
                    }
                    groupScore.setPointsAwarded(scoreItem.getInputPoints());
                    
                    List<String> comments = new ArrayList<>();
                    if (scoreItem.getComment() != null && !scoreItem.getComment().trim().isEmpty()) {
                        comments.add(scoreItem.getComment());
                    }
                    groupScore.setComments(comments);
                    
                    groupScores.add(groupScore);
                    log.debug("Added group score: {}", scoreItem.getDescription());
                    
                } else if ("INDIVIDUAL".equals(scoreType)) {
                    // Process as individual score
                    AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore individualScore = 
                            new AdminParticipantDetailDTO.ExaminerSubmission.RubricScores.IndividualScore();
                    individualScore.setStudentId(scoreItem.getStudentId());
                    
                    // Look up student name from user table
                    if (scoreItem.getStudentId() != null) {
                        try {
                            SysUser student = sysUserMapper.selectById(scoreItem.getStudentId());
                            if (student != null) {
                                individualScore.setStudentName(student.getUserName());
                            }
                        } catch (Exception e) {
                            log.warn("Failed to look up student name for student ID {}: {}", 
                                    scoreItem.getStudentId(), e.getMessage());
                        }
                    }
                    
                    individualScore.setCriterionDescription(scoreItem.getDescription());
                    if (scoreItem.getSelectedLevel() != null) {
                        individualScore.setSelectedLevel(scoreItem.getSelectedLevel().getDescription());
                    }
                    individualScore.setPointsAwarded(scoreItem.getInputPoints());
                    
                    List<String> comments = new ArrayList<>();
                    if (scoreItem.getComment() != null && !scoreItem.getComment().trim().isEmpty()) {
                        comments.add(scoreItem.getComment());
                    }
                    individualScore.setComments(comments);
                    
                    individualScores.add(individualScore);
                    log.debug("Added individual score: {} for student {}", 
                            scoreItem.getDescription(), scoreItem.getStudentId());
                }
            }
            
            rubricScores.setGroup(groupScores);
            rubricScores.setIndividual(individualScores);
            
            log.debug("Final rubric scores: groupScores.size={}, individualScores.size={}", 
                    groupScores.size(), individualScores.size());
            
        } catch (Exception e) {
            log.error("Error parsing rubric scores for examiner {}: {}", 
                    examinerData.get("examiner_id"), e.getMessage(), e);
            rubricScores.setGroup(new ArrayList<>());
            rubricScores.setIndividual(new ArrayList<>());
        }
        
        return rubricScores;
    }
}
