package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Assessment submission response")
public class AssessmentSubmissionDTO {
    private Long submissionId;
    private Long assignmentId;
    private Long sessionId;
    private String subjectType;
    private Long subjectId;
    private Long examinerId;
    private String status;
    private String overallFeedback;
    private Double totalScore;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;

    @Schema(description = "Rubric meta snapshot JSON string")
    private String rubricMetaSnapshot;
    @Schema(description = "Rubrics info snapshot JSON string")
    private String rubricsInfoSnapshot;
    @Schema(description = "Scores JSON string")
    private String scoresJson;
}


