package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ReleaseAssessmentRequestDTO;
import org.swen90017.oas.dto.request.ReviewExaminerRequestDTO;
import org.swen90017.oas.dto.request.UpdateFinalScoreRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.AdminResultsService;
import org.swen90017.oas.utils.SecurityUtils;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/admin/subjects/{subjectId}/assignments/{assignmentId}")
@RequiredArgsConstructor
@Tag(name = "Admin Results", description = "Course admin results management endpoints")
public class AdminResultsController {

    private final AdminResultsService adminResultsService;

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
            @RequestParam(required = false) @Parameter(description = "Filter by is released") Boolean isReleased) {
        
        PageResult<AssessmentSummaryDTO> result = adminResultsService.listAssessments(
                subjectId, assignmentId, pageNum, pageSize, q, sessionId, isReleased);
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

    @PostMapping("/assessments/{submissionId}/release")
    @Operation(summary = "Release assessment", 
               description = "Release assessment results to students with optional email notification")
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
}
