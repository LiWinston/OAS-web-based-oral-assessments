package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Submit assessment request")
public class SubmitAssessmentRequestDTO {
    private Long submissionId; // preferred

    // Or use locator keys (when submissionId is not provided)
    private Long assignmentId;
    private Long sessionId;
    private String subjectType;
    private Long subjectId;

    // For direct submit, payload may include the same content as draft
    @Schema(description = "Overall feedback for student/group")
    private String overallFeedback;
    @Schema(description = "Admin-only note")
    private String adminNote;
    @Schema(description = "Scores array aligning to rubrics_info by description")
    private List<SaveAssessmentDraftRequestDTO.ScoreItem> scores;
}


