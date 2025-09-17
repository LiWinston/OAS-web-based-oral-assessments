package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.StudentExaminerFeedbackDTO;
import org.swen90017.oas.dto.response.StudentResultOverviewDTO;
import org.swen90017.oas.dto.response.StudentResultSummaryDTO;
import org.swen90017.oas.dto.response.StudentRubricBreakdownDTO;
import org.swen90017.oas.dto.response.StudentRubricScaleDTO;

public interface StudentResultsService {
    StudentResultOverviewDTO listStudentResults(Long studentId, String status, String semester, int pageNum, int pageSize, String sort, String ifModifiedSince);

    StudentResultSummaryDTO getAssignmentResultSummary(Long studentId, Long assignmentId, String ifModifiedSince);

    StudentRubricBreakdownDTO getRubricBreakdown(Long studentId, Long assignmentId);

    StudentRubricScaleDTO getRubricScale(Long studentId, Long assignmentId);

    StudentExaminerFeedbackDTO getExaminerFeedback(Long studentId, Long assignmentId);
}


