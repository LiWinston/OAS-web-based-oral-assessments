package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.StudentResultDetailDTO;
import org.swen90017.oas.dto.response.StudentResultOverviewDTO;

public interface StudentResultsService {
    StudentResultOverviewDTO listStudentResults(Long studentId, String status, String semester, int pageNum, int pageSize, String sort, String ifModifiedSince);

    StudentResultDetailDTO getAssignmentResultDetail(Long studentId, Long assignmentId, String ifModifiedSince);
}


