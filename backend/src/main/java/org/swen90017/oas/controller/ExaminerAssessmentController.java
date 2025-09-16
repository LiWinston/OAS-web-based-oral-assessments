package org.swen90017.oas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ExaminerAssessmentsQueryDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.request.SubmitAssessmentRequestDTO;
import org.swen90017.oas.dto.response.AssessmentSubmissionDTO;
import org.swen90017.oas.dto.response.ExaminerSummaryDTO;
import org.swen90017.oas.dto.response.ExaminerAssessmentsPageResponseDTO;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.AssessmentService;
import org.swen90017.oas.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/examiner/assessments")
@Tag(name = "Examiner Assessments", description = "Examiner assessments: draft, submit, query, summary")
public class ExaminerAssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping("/draft/save")
    @Operation(summary = "Save assessment draft", description = "Create or update draft; validate rubric and scores")
    public Result<AssessmentSubmissionDTO> saveDraft(@RequestBody SaveAssessmentDraftRequestDTO request) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        AssessmentSubmissionDTO dto = assessmentService.saveDraft(request, examinerId);
        return Result.success(dto);
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit assessment", description = "Require all rubric criteria completed at submit time")
    public Result<AssessmentSubmissionDTO> submit(@RequestBody SubmitAssessmentRequestDTO request) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        AssessmentSubmissionDTO dto = assessmentService.submit(request, examinerId);
        return Result.success(dto);
    }

    @GetMapping("/{submissionId}")
    @Operation(summary = "Get one submission", description = "Visible to the owner only")
    public Result<AssessmentSubmissionDTO> getOne(@Parameter(description = "Submission ID") @PathVariable Long submissionId) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.getMySubmission(submissionId, examinerId));
    }

    @PostMapping("/list")
    @Operation(summary = "List assessments (non-paginated)", description = "Supports filters such as assignmentId/status/date range, etc.")
    public Result<List<AssessmentSubmissionDTO>> list(@RequestBody ExaminerAssessmentsQueryDTO query) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.listMySubmissions(query, examinerId));
    }

    @PostMapping("/page")
    @Operation(summary = "List assessments (paginated)", description = "Supports pagination; sortable columns whitelist: updated_at/created_at/submitted_at/total_score")
    public Result<ExaminerAssessmentsPageResponseDTO> page(@RequestBody ExaminerAssessmentsQueryDTO query) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.pageMySubmissions(query, examinerId));
    }

    @PostMapping("/summary")
    @Operation(summary = "Assessments summary", description = "Return counts for draft/submitted, etc.")
    public Result<ExaminerSummaryDTO> summary(@RequestBody ExaminerAssessmentsQueryDTO query) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.getMySummary(query, examinerId));
    }
}


