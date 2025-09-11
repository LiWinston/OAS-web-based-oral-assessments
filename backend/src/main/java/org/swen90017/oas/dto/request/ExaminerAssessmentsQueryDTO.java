package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;

@Data
@Schema(description = "Query examiner assessments")
public class ExaminerAssessmentsQueryDTO {
    private Long assignmentId;
    private String status; // DRAFT | SUBMITTED | RETURNED
    private LocalDate from;
    private LocalDate to;
}


