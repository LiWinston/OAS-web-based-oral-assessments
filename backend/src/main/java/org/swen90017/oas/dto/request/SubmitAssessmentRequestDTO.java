package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.Valid;
import java.util.List;

@Data
@Schema(description = "Submit assessment request")
public class SubmitAssessmentRequestDTO {
    @Schema(description = "Submission ID (preferred method to identify which submission to submit)")
    private Long submissionId;

    // Or use locator keys (when submissionId is not provided)
    @Schema(description = "Assignment ID (used with other locator keys when submissionId not provided)")
    private Long assignmentId;
    
    @Schema(description = "Session ID (used with other locator keys when submissionId not provided)")
    private Long sessionId;
    
    @Schema(
        description = "Subject type: 'INDIVIDUAL' for student, 'GROUP' for group, 'MIX' for mixed assessment with both types",
        allowableValues = {"INDIVIDUAL", "GROUP", "MIX", "STUDENT"}
    )
    private String subjectType;
    
    @Schema(description = "Subject ID - Student ID for INDIVIDUAL, Group ID for GROUP or MIX")
    private Long subjectId;

    // For direct submit, payload may include the same content as draft
    @Schema(description = "Overall feedback for student/group")
    private String overallFeedback;
    
    @Schema(description = "Admin-only note")
    private String adminNote;
    
    @Schema(description = "Unified scores array. For MIX type, use 'type' field in each score to distinguish GROUP vs INDIVIDUAL. " +
        "For INDIVIDUAL type scores, include 'studentId' and optionally 'individualFeedback'.")
    private List<SaveAssessmentDraftRequestDTO.ScoreItem> scores;
    
    /**
     * @deprecated Use the unified 'scores' array with 'type' field instead.
     */
    @Deprecated
    @Schema(
        description = "DEPRECATED: Use unified 'scores' array with 'type' field instead. " +
            "Individual scores for MIX type assessments. Only applicable when subjectType is GROUP and assignment type is 'mixed'. " +
            "If provided, the system will automatically save and submit individual assessments for each student in the group.",
        nullable = true,
        deprecated = true
    )
    @Valid
    private List<SaveAssessmentDraftRequestDTO.IndividualStudentScore> individualScores;
}


