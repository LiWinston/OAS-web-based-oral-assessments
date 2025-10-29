package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.ExaminerMarkingTrendSummaryResponseDTO;

public interface AdminReportService {

    ExaminerMarkingTrendSummaryResponseDTO getExaminerMarkingTrendSummary(Long assignmentId,
                                                                          String status,
                                                                          Integer minSessions);
}

