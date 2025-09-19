package org.swen90017.oas.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class ExaminerAssessmentsPageResponseDTO {
    private List<AssessmentSubmissionDTO> items;
    private PaginationDTO pagination;
}


