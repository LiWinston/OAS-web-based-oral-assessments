package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ReleaseAssessmentRequestDTO;
import org.swen90017.oas.dto.request.ReviewExaminerRequestDTO;
import org.swen90017.oas.dto.request.UpdateFinalScoreRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.AdminMarkConsolidationService;
import org.swen90017.oas.service.AdminResultsService;
import org.swen90017.oas.utils.SecurityUtils;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/subjects/{subjectId}/assignments/{assignmentId}")
@RequiredArgsConstructor
@Tag(name = "Admin Results", description = "Course admin results management endpoints")
public class AdminResultsController {

    private final AdminResultsService adminResultsService;
    private final AdminMarkConsolidationService adminMarkConsolidationService;

    @GetMapping("/mark-consolidation/overview")
    @Operation(summary = "Get mark consolidation overview",
            description = "Aggregate snapshot for the admin mark consolidation dashboard." )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved overview"),
            @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public Result<MarkConsolidationOverviewResponseDTO> getMarkConsolidationOverview(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(required = false) @Parameter(description = "Filter metrics to a specific session") Long sessionId,
            @RequestParam(defaultValue = "true") @Parameter(description = "Whether to include progress breakdown") boolean includeProgressBreakdown) {

        MarkConsolidationOverviewResponseDTO data = adminMarkConsolidationService.getOverview(
                subjectId, assignmentId, sessionId, includeProgressBreakdown);
        return Result.success(data);
    }

    @GetMapping("/mark-consolidation/trends")
    @Operation(summary = "Get mark consolidation trends",
            description = "Time-series data for examiner submissions, overrides, and reopen events.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved trends"),
            @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public Result<MarkConsolidationTrendsResponseDTO> getMarkConsolidationTrends(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @Parameter(description = "Inclusive range start (ISO date)") LocalDate rangeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @Parameter(description = "Inclusive range end (ISO date)") LocalDate rangeEnd,
            @RequestParam(defaultValue = "day") @Parameter(description = "Bucket interval (day|week)") String interval,
            @RequestParam(required = false) @Parameter(description = "Filter by session ID") Long sessionId) {

        MarkConsolidationTrendsResponseDTO data = adminMarkConsolidationService.getTrends(
                subjectId, assignmentId, sessionId, rangeStart, rangeEnd, interval);
        return Result.success(data);
    }

    @GetMapping("/mark-consolidation/alerts")
    @Operation(summary = "Get mark consolidation alerts",
            description = "Curated list of participants requiring attention for mark consolidation.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved alerts"),
            @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
            @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public Result<MarkConsolidationAlertsResponseDTO> getMarkConsolidationAlerts(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(required = false) @Parameter(description = "Filter alerts to a specific session") Long sessionId,
            @RequestParam(required = false, defaultValue = "10") @Parameter(description = "Maximum number of alerts to return") Integer limit,
            @RequestParam(required = false) @Parameter(description = "Comma separated alert types to include") String types) {

        Set<String> typeFilters = parseAlertTypes(types);
        MarkConsolidationAlertsResponseDTO data = adminMarkConsolidationService.getAlerts(
                subjectId, assignmentId, sessionId, typeFilters, limit == null ? 10 : limit);
        return Result.success(data);
    }

    @GetMapping("/assessments")
    @Operation(summary = "List assessments for an assignment", 
               description = "Get paginated list of assessments with computed scores and release status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved assessments"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public Result<PageResult<AssessmentSummaryDTO>> listAssessments(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(defaultValue = "1") @Parameter(description = "Page number") Integer pageNum,
            @RequestParam(defaultValue = "20") @Parameter(description = "Page size") Integer pageSize,
            @RequestParam(required = false) @Parameter(description = "Search query (student/group name or ID)") String q,
            @RequestParam(required = false) @Parameter(description = "Filter by session ID") Long sessionId,
            @RequestParam(required = false) @Parameter(description = "Filter by is released") Boolean isReleased,
            @RequestParam(required = false, defaultValue = "all") @Parameter(description = "Filter by release status (all|released|not_released)") String releaseStatus,
            @RequestParam(required = false, defaultValue = "all") @Parameter(description = "Filter by examiner progress (all|ready|attention|incomplete)") String progress,
            @RequestParam(required = false, defaultValue = "false") @Parameter(description = "Fetch all rows ignoring pagination") Boolean includeAll) {
        
        Boolean releaseFilter = resolveReleaseFilter(isReleased, releaseStatus);
        String progressFilter = progress != null ? progress : "all";
        
        PageResult<AssessmentSummaryDTO> result = adminResultsService.listAssessments(
                subjectId, assignmentId, pageNum, pageSize, q, sessionId, releaseFilter, progressFilter, includeAll);
        return Result.success(result);
    }

    @GetMapping("/assessments/{submissionId}")
    @Operation(summary = "Get assessment detail", 
               description = "Get detailed assessment information including all examiner markings and rubric")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved assessment detail"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Assessment not found")
    })
    public Result<AssessmentDetailDTO> getAssessmentDetail(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Submission ID") Long submissionId) {
        AssessmentDetailDTO result = adminResultsService.getAssessmentDetail(subjectId, assignmentId, submissionId);
        return Result.success(result);
    }

    /**
     * @deprecated This endpoint is deprecated and will be removed in a future version.
     * Use alternative endpoints for accessing examiner marking details.
     */
    @Deprecated
    @GetMapping("/assessments/{submissionId}/examiners/{examinerId}")
    @Operation(summary = "Get examiner marking detail (DEPRECATED)", 
               description = "Get detailed marking information for a specific examiner. This endpoint is deprecated.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved examiner marking detail"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Examiner marking not found")
    })
    public Result<ExaminerMarkDetailDTO> getExaminerMarkDetail(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Submission ID") Long submissionId,
            @PathVariable @Parameter(description = "Examiner ID") Long examinerId) {
        
        ExaminerMarkDetailDTO result = adminResultsService.getExaminerMarkDetail(
                subjectId, assignmentId, submissionId, examinerId);
        return Result.success(result);
    }

    @PostMapping("/assessments/{submissionId}/examiners/{examinerId}/review")
    @Operation(summary = "Review examiner marking", 
               description = "Reopen an examiner's marking for revision and send notification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully reviewed examiner marking"),
        @ApiResponse(responseCode = "400", description = "Invalid request or examiner already reopened"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Examiner marking not found")
    })
    public Result<ReviewExaminerResponseDTO> reviewExaminerMarking(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Submission ID") Long submissionId,
            @PathVariable @Parameter(description = "Examiner ID") Long examinerId,
            @Valid @RequestBody ReviewExaminerRequestDTO request) {
        
        LoginUser loginUser = SecurityUtils.getLoginUser();
        ReviewExaminerResponseDTO result = adminResultsService.reviewExaminerMarking(
                subjectId, assignmentId, submissionId, examinerId, request, loginUser.getUserId());
        
        return Result.success(result);
    }

    @PutMapping("/assessments/{submissionId}/final-score")
    @Operation(summary = "Set final score for all examiners", 
               description = "Manually set the final score for all examiner assessments of the same student in the same assignment (overrides computed average for all examiners)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully set final score for all examiners"),
        @ApiResponse(responseCode = "400", description = "Invalid score value"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Assessment not found")
    })
    public Result<AssessmentDetailDTO> setFinalScore(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Submission ID") Long submissionId,
            @Valid @RequestBody UpdateFinalScoreRequestDTO request) {
        
        LoginUser loginUser = SecurityUtils.getLoginUser();
        AssessmentDetailDTO result = adminResultsService.setFinalScore(
                subjectId, assignmentId, submissionId, request, 1l);//loginUser.getUserId());
        
        return Result.success(result);
    }

    /**
     * @deprecated Use releaseGroupAssessment or releaseIndividualAssessment instead
     */
    @Deprecated
    @PostMapping("/assessments/{submissionId}/release")
    @Operation(summary = "Release assessment (DEPRECATED)", 
               description = "This endpoint is deprecated. Use /group/{groupId}/release or /individual/{studentId}/release instead.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully released assessment"),
        @ApiResponse(responseCode = "400", description = "Cannot release - no submitted examiners"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Assessment not found")
    })
    public Result<ReleaseAssessmentResponseDTO> releaseAssessment(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Submission ID") Long submissionId,
            @Valid @RequestBody ReleaseAssessmentRequestDTO request) {
        
        LoginUser loginUser = SecurityUtils.getLoginUser();

        ReleaseAssessmentResponseDTO result = adminResultsService.releaseAssessment(
                subjectId, assignmentId, submissionId, request, loginUser.getUserId());
        
        return Result.success(result);
    }

    @PostMapping("/group/{groupId}/release")
    @Operation(summary = "Release group assessment", 
               description = "Release assessment results for all examiners of a group with optional email notification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully released assessment"),
        @ApiResponse(responseCode = "400", description = "Cannot release - no submitted examiners"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Group or assignment not found")
    })
    public Result<ReleaseAssessmentResponseDTO> releaseGroupAssessment(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Group ID") Long groupId,
            @Valid @RequestBody ReleaseAssessmentRequestDTO request) {
        
        LoginUser loginUser = SecurityUtils.getLoginUser();

        ReleaseAssessmentResponseDTO result = adminResultsService.releaseGroupAssessment(
                subjectId, assignmentId, groupId, request, loginUser.getUserId());
        
        return Result.success(result);
    }

    @PostMapping("/individual/{studentId}/release")
    @Operation(summary = "Release individual assessment", 
               description = "Release assessment results for all examiners of a student with optional email notification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully released assessment"),
        @ApiResponse(responseCode = "400", description = "Cannot release - no submitted examiners"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Student or assignment not found")
    })
    public Result<ReleaseAssessmentResponseDTO> releaseIndividualAssessment(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Student ID") Long studentId,
            @Valid @RequestBody ReleaseAssessmentRequestDTO request) {
        
        LoginUser loginUser = SecurityUtils.getLoginUser();

        ReleaseAssessmentResponseDTO result = adminResultsService.releaseIndividualAssessment(
                subjectId, assignmentId, studentId, request, loginUser.getUserId());
        
        return Result.success(result);
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get sessions for assignment (Step 1)", 
               description = "Get paginated list of sessions for an assignment with participant count")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved sessions"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Assignment not found")
    })
    public Result<PageResult<AdminSessionResultsDTO.SessionItem>> getSessionsForAssignment(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(defaultValue = "1") @Parameter(description = "Page number") Integer pageNum,
            @RequestParam(defaultValue = "10") @Parameter(description = "Page size") Integer pageSize,
            @RequestParam(required = false) @Parameter(description = "Search query (session date, time, venue)") String q) {
        
        PageResult<AdminSessionResultsDTO.SessionItem> result = adminResultsService.getSessionsForAssignment(
                subjectId, assignmentId, pageNum, pageSize, q);
        return Result.success(result);
    }

    @GetMapping("/sessions/{sessionId}/participants")
    @Operation(summary = "Get participants for session (Step 2)", 
               description = "Get paginated list of participants (groups or individuals) for a specific session")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved participants"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Session not found")
    })
    public Result<PageResult<AdminSessionParticipantsDTO.ParticipantItem>> getParticipantsForSession(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Session ID") Long sessionId,
            @RequestParam(defaultValue = "1") @Parameter(description = "Page number") Integer pageNum,
            @RequestParam(defaultValue = "20") @Parameter(description = "Page size") Integer pageSize,
            @RequestParam(required = false, defaultValue = "ALL") @Parameter(description = "Filter by type (ALL, GROUP, INDIVIDUAL)") String type,
            @RequestParam(required = false, defaultValue = "all") @Parameter(description = "Filter by release status (all, released, not_released)") String status,
            @RequestParam(required = false) @Parameter(description = "Search query (group/student name or number)") String q) {
        
        PageResult<AdminSessionParticipantsDTO.ParticipantItem> result = adminResultsService.getParticipantsForSession(
                subjectId, assignmentId, sessionId, pageNum, pageSize, type, status, q);
        return Result.success(result);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get complete group detail with examiners (Step 3 - Enhanced)", 
               description = "Get complete group information including assignment, session, rubric snapshot, and all examiner submissions")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved group detail"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Group or assignment not found")
    })
    public Result<AdminParticipantDetailDTO> getGroupDetailWithExaminers(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Group ID") Long groupId) {
        AdminParticipantDetailDTO result = adminResultsService.getGroupDetailWithExaminers(subjectId, assignmentId, groupId);
        return Result.success(result);
    }

    @GetMapping("/individual/{studentId}")
    @Operation(summary = "Get complete individual detail with examiners (Step 3 - Enhanced)", 
               description = "Get complete individual information including assignment, session, rubric snapshot, and all examiner submissions")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved individual detail"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Student or assignment not found")
    })
    public Result<AdminParticipantDetailDTO> getIndividualDetailWithExaminers(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Student ID") Long studentId) {
        AdminParticipantDetailDTO result = adminResultsService.getIndividualDetailWithExaminers(subjectId, assignmentId, studentId);
        return Result.success(result);
    }

    /**
     * @deprecated Use getGroupDetailWithExaminers instead
     */
    @Deprecated
    @GetMapping("/group/{groupId}/legacy")
    @Operation(summary = "Get examiner scoring for group (DEPRECATED)", 
               description = "This endpoint is deprecated. Use /group/{groupId} for enhanced response.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved examiner scoring"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Group or assignment not found")
    })
    public Result<ExaminerScoringDTO> getGroupExaminerScoring(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Group ID") Long groupId) {
        ExaminerScoringDTO result = adminResultsService.getGroupExaminerScoring(subjectId, assignmentId, groupId);
        return Result.success(result);
    }

    /**
     * @deprecated Use getIndividualDetailWithExaminers instead
     */
    @Deprecated
    @GetMapping("/individual/{studentId}/legacy")
    @Operation(summary = "Get examiner scoring for individual student (DEPRECATED)", 
               description = "This endpoint is deprecated. Use /individual/{studentId} for enhanced response.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved examiner scoring"),
        @ApiResponse(responseCode = "403", description = "Access denied - not a course admin"),
        @ApiResponse(responseCode = "404", description = "Student or assignment not found")
    })
    public Result<ExaminerScoringDTO> getIndividualExaminerScoringLegacy(
            @PathVariable @Parameter(description = "Subject ID") Long subjectId,
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @PathVariable @Parameter(description = "Student ID") Long studentId) {
        ExaminerScoringDTO result = adminResultsService.getIndividualExaminerScoring(subjectId, assignmentId, studentId);
        return Result.success(result);
    }

    private Set<String> parseAlertTypes(String types) {
        if (types == null || types.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return Arrays.stream(types.split(","))
                .map(String::trim)
                .filter(token -> !token.isEmpty())
                .collect(Collectors.toSet());
    }

    private Boolean resolveReleaseFilter(Boolean isReleased, String releaseStatus) {
        if (releaseStatus != null && !releaseStatus.trim().isEmpty()) {
            String value = releaseStatus.trim().toLowerCase();
            switch (value) {
                case "released":
                case "true":
                case "yes":
                    return true;
                case "not_released":
                case "notreleased":
                case "unreleased":
                case "false":
                case "no":
                    return false;
                case "all":
                    return null;
                default:
                    break;
            }
        }
        return isReleased;
    }
}
