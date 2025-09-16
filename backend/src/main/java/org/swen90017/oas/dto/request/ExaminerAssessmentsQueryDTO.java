package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "Query examiner assessments (supports filters and pagination)")
public class ExaminerAssessmentsQueryDTO extends PageRequestDTO {
    @Schema(description = "Assignment ID filter")
    private Long assignmentId;

    @Schema(description = "Session ID filter")
    private Long sessionId;

    @Schema(description = "Subject type: INDIVIDUAL | GROUP")
    private String subjectType;

    @Schema(description = "Subject ID (studentId or groupId)")
    private Long subjectId;

    @Schema(description = "Single status filter: DRAFT | SUBMITTED | RETURNED")
    private String status;

    @Schema(description = "Multiple statuses filter; used if present, overrides status")
    private List<String> statuses;

    @Schema(description = "Created date from (inclusive)")
    private LocalDate createdFrom;

    @Schema(description = "Created date to (inclusive)")
    private LocalDate createdTo;

    @Schema(description = "Submitted date from (inclusive)")
    private LocalDate submittedFrom;

    @Schema(description = "Submitted date to (inclusive)")
    private LocalDate submittedTo;

    @Schema(description = "Minimum total score (inclusive)")
    private Double minScore;

    @Schema(description = "Maximum total score (inclusive)")
    private Double maxScore;

    @Schema(description = "Keyword to search in overallFeedback/adminNote")
    private String keyword;
}


