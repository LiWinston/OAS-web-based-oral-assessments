package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * Save Assessment Draft Request DTO
 * 
 * This DTO is used to save or update an assessment draft. Examiners can save partial assessments
 * and continue working on them later before final submission.
 * 
 * Usage Examples:
 * 1. Create new draft for individual student assessment
 * 2. Update existing draft with additional scores/feedback
 * 3. Save partial assessment when examiner needs to pause evaluation
 */
@Data
@Schema(
    description = "Request DTO for saving assessment drafts. Allows examiners to create or update partial assessments before final submission."
)
public class SaveAssessmentDraftRequestDTO {

    @Schema(
        description = "Assignment ID that this assessment belongs to",
        example = "101",
        required = true
    )
    @NotNull(message = "Assignment ID is required")
    private Long assignmentId;

    @Schema(
        description = "Session ID (optional). If provided, validates that the examiner is assigned to this session",
        example = "649",
        nullable = true
    )
    private Long sessionId;

    @Schema(
        description = "Subject type being assessed. Options: " +
            "'INDIVIDUAL' for student assessment, " +
            "'GROUP' for group assessment, " +
            "'MIX' for mixed type assessment (both individual and group scores in unified scores array). " +
            "If not provided, will be auto-detected from the assignment type.",
        example = "INDIVIDUAL",
        allowableValues = {"INDIVIDUAL", "GROUP", "MIX"},
        nullable = true
    )
    private String subjectType;

    @Schema(
        description = "Subject ID - Student ID for INDIVIDUAL assessment, Group ID for GROUP or MIX assessment",
        example = "105",
        required = true
    )
    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @Schema(
        description = "Overall feedback for the student/group. This will be visible to students when results are released",
        example = "Good presentation but needs improvement on technical details. Consider reviewing the core concepts before final submission.",
        maxLength = 2000
    )
    @Size(max = 2000, message = "Overall feedback cannot exceed 2000 characters")
    private String overallFeedback;

    @Schema(
        description = "Administrative note visible only to administrators and other examiners. Use this for internal comments about the assessment",
        example = "Student was nervous during presentation, consider this context in final evaluation",
        maxLength = 1000
    )
    @Size(max = 1000, message = "Admin note cannot exceed 1000 characters")
    private String adminNote;

    @Schema(
        description = "Array of scores for each rubric criterion. Each score item must align with the assignment's rubric configuration",
        required = true
    )
    @Valid
    private List<ScoreItem> scores;
    
    /**
     * @deprecated Use the unified 'scores' array with 'type' field instead.
     * For MIX type assessments, include both GROUP and INDIVIDUAL scores in the 'scores' array,
     * using the 'type' and 'studentId' fields to distinguish them.
     */
    @Deprecated
    @Schema(
        description = "DEPRECATED: Use unified 'scores' array with 'type' field instead. " +
            "Individual scores for MIX type assessments. Only applicable when subjectType is GROUP and assignment type is 'mixed'. " +
            "If provided, the system will automatically save individual assessments for each student in the group.",
        nullable = true,
        deprecated = true
    )
    @Valid
    private List<IndividualStudentScore> individualScores;

    /**
     * Individual score item for a rubric criterion
     * For MIX type assessments, use 'type' field to distinguish between GROUP and INDIVIDUAL scores
     */
    @Data
    @Schema(description = "Score item for a specific rubric criterion")
    public static class ScoreItem {

        @Schema(
            description = "Score type: 'GROUP' for group criteria or 'INDIVIDUAL' for individual student criteria. " +
                "For non-MIX assignments, this field can be omitted (defaults to the submission's subjectType). " +
                "For MIX type assignments, this field is required to distinguish group vs individual scores.",
            example = "GROUP",
            allowableValues = {"GROUP", "INDIVIDUAL"},
            nullable = true
        )
        private String type;
        
        @Schema(
            description = "Student ID - required only when type='INDIVIDUAL' for MIX type assessments. " +
                "Identifies which student this individual score belongs to.",
            example = "201",
            nullable = true
        )
        private Long studentId;
        
        @Schema(
            description = "Individual feedback for this student - only applicable when type='INDIVIDUAL'",
            example = "Great individual contribution!",
            maxLength = 2000,
            nullable = true
        )
        @Size(max = 2000, message = "Individual feedback cannot exceed 2000 characters")
        private String individualFeedback;

        @Schema(
            description = "Rubric criterion description that matches the assignment's rubric configuration",
            example = "Technical Knowledge",
            required = true
        )
        @NotNull(message = "Score item description is required")
        private String description;

        @Schema(
            description = "Scale type for this criterion. Supported types: 'points', 'descriptive', 'percentage', 'letter', 'numeric'",
            example = "percentage",
            allowableValues = {"points", "descriptive", "percentage", "letter", "numeric"},
            required = true
        )
        @NotNull(message = "Scale type is required")
        private String scaleType;

        @Schema(
            description = "Weight of this criterion from rubric configuration. Can be null for percentage scale or numeric value for points/descriptive",
            example = "25",
            nullable = true
        )
        private Double weight;

        @Schema(
            description = "Points awarded for this criterion. Required for all scale types. Must be within the selectedLevel range (0-100)",
            example = "85.0",
            required = true
        )
        @NotNull(message = "Input points is required for all scale types")
        private Double inputPoints;

        @Schema(
            description = "Selected performance level. Required for all scale types. The inputPoints must fall within this level's range",
            required = true
        )
        @Valid
        @NotNull(message = "Selected level is required for all scale types")
        private SelectedLevel selectedLevel;

        @Schema(
            description = "Specific comment for this criterion to provide detailed feedback",
            example = "Shows good understanding of basic concepts but needs to demonstrate more advanced knowledge",
            maxLength = 500
        )
        @Size(max = 500, message = "Score comment cannot exceed 500 characters")
        private String comment;
    }

    /**
     * Selected performance level for scale types that use performance levels
     * Supports the standard rubric performanceLevel structure with startPoint/endPoint ranges
     */
    @Data
    @Schema(description = "Performance level selection for rubric criteria with performance levels")
    public static class SelectedLevel {

        @Schema(
            description = "Performance level description (e.g., 'Excellent', 'Outstanding', 'Very Good', 'Satisfactory')",
            example = "Excellent",
            required = true
        )
        @NotNull(message = "Level description is required")
        private String description;

        @Schema(
            description = "Starting point of the performance level range",
            example = "90.0",
            required = true
        )
        @NotNull(message = "Start point is required")
        private Double startPoint;

        @Schema(
            description = "Ending point of the performance level range",
            example = "100.0",
            required = true
        )
        @NotNull(message = "End point is required")
        private Double endPoint;
    }
    
    /**
     * Individual student score for MIX type assessment
     */
    @Data
    @Schema(description = "Individual student scores with feedback (for MIX type)")
    public static class IndividualStudentScore {

        @Schema(description = "Student user ID", example = "2001", required = true)
        @NotNull(message = "Student ID is required")
        private Long studentId;

        @Schema(description = "Individual feedback for this student", maxLength = 2000)
        @Size(max = 2000, message = "Individual feedback cannot exceed 2000 characters")
        private String individualFeedback;

        @Schema(description = "Scores for individual rubrics", required = true)
        @Valid
        @NotNull(message = "Scores are required")
        private List<ScoreItem> scores;
    }
}


