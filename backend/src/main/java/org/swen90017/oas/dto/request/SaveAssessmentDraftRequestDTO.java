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
        description = "Subject type being assessed. Must be either 'INDIVIDUAL' for student assessment or 'GROUP' for group assessment",
        example = "INDIVIDUAL",
        allowableValues = {"INDIVIDUAL", "GROUP", "STUDENT"},
        required = true
    )
    @NotNull(message = "Subject type is required")
    private String subjectType;

    @Schema(
        description = "Subject ID - Student ID for individual assessment or Group ID for group assessment",
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
     * Individual score item for a rubric criterion
     */
    @Data
    @Schema(description = "Score item for a specific rubric criterion")
    public static class ScoreItem {

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
            description = "Points awarded for this criterion. For percentage scale: 0-100, for points scale: actual score value",
            example = "100.0"
        )
        private Double inputPoints;

        @Schema(
            description = "Selected performance level (used for 'descriptive', 'letter', 'numeric', and some 'percentage' scale types)"
        )
        @Valid
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
}


