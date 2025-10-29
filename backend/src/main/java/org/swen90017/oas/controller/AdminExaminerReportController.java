package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.response.ExaminerMarkingTrendSummaryResponseDTO;
import org.swen90017.oas.service.AdminReportService;

@RestController
@RequestMapping("/api/admin/reports/examiners")
@RequiredArgsConstructor
@Tag(name = "Admin Examiner Reports", description = "Examiner marking trend summaries for course admins")
public class AdminExaminerReportController {

    private final AdminReportService adminReportService;

    @GetMapping("/{assignmentId}/summary")
    @Operation(summary = "Get examiner marking trend summary",
            description = "Aggregated average scores and submission counts per examiner for an assignment")
    public Result<ExaminerMarkingTrendSummaryResponseDTO> getExaminerSummary(
            @PathVariable @Parameter(description = "Assignment ID") Long assignmentId,
            @RequestParam(defaultValue = "SUBMITTED") @Parameter(description = "Submission status filter: SUBMITTED | ALL") String status,
            @RequestParam(required = false, defaultValue = "0") @Parameter(description = "Minimum session threshold for inclusion") Integer minSessions) {
        ExaminerMarkingTrendSummaryResponseDTO response = adminReportService
                .getExaminerMarkingTrendSummary(assignmentId, status, minSessions);
        return Result.success(response);
    }
}

