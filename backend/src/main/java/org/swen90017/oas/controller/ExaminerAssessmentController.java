package org.swen90017.oas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ExaminerAssessmentsQueryDTO;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.request.SubmitAssessmentRequestDTO;
import org.swen90017.oas.dto.response.AssessmentSubmissionDTO;
import org.swen90017.oas.dto.response.ExaminerSummaryDTO;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.AssessmentService;
import org.swen90017.oas.utils.SecurityUtils;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/examiner/assessments")
public class ExaminerAssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping("/draft/save")
    public Result<AssessmentSubmissionDTO> saveDraft(@RequestBody SaveAssessmentDraftRequestDTO request) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        AssessmentSubmissionDTO dto = assessmentService.saveDraft(request, examinerId);
        return Result.success(dto);
    }

    @PostMapping("/submit")
    public Result<AssessmentSubmissionDTO> submit(@RequestBody SubmitAssessmentRequestDTO request) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        AssessmentSubmissionDTO dto = assessmentService.submit(request, examinerId);
        return Result.success(dto);
    }

    @GetMapping("/{submissionId}")
    public Result<AssessmentSubmissionDTO> getOne(@PathVariable Long submissionId) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.getMySubmission(submissionId, examinerId));
    }

    @GetMapping
    public Result<List<AssessmentSubmissionDTO>> list(ExaminerAssessmentsQueryDTO query) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.listMySubmissions(query, examinerId));
    }

    @GetMapping("/summary")
    public Result<ExaminerSummaryDTO> summary(ExaminerAssessmentsQueryDTO query) {
        LoginUser user = SecurityUtils.getLoginUser();
        Long examinerId = user == null ? null : user.getUserId();
        return Result.success(assessmentService.getMySummary(query, examinerId));
    }
}


