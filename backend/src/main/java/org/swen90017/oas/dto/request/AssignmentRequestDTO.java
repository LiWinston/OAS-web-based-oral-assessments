package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment Request DTO
 * Used for creating and updating assignments
 */
@Schema(description = "Assignment creation and update request data")
@Data
public class AssignmentRequestDTO {

    /**
     * Assignment ID (for update operations)
     */
    @Schema(description = "Assignment ID (for update operations)", example = "1")
    private Long id;

    /**
     * Subject ID (Foreign Key to subject table)
     */
    @Schema(description = "Subject ID", example = "1")
    @NotNull(message = "Subject ID cannot be null")
    private Long subjectId;

    /**
     * Assignment name
     */
    @Schema(description = "Assignment name", example = "Oral Presentation")
    @NotBlank(message = "Assignment name cannot be blank")
    @Size(max = 255, message = "Assignment name cannot exceed 255 characters")
    private String name;

    /**
     * Assignment description
     */
    @Schema(description = "Assignment description", example = "Individual oral presentation on project progress")
    private String description;

    /**
     * Assignment type (individual, group, mixed)
     */
    @Schema(description = "Assignment type", example = "individual", allowableValues = {"individual", "group", "mixed"})
    @NotBlank(message = "Assignment type cannot be blank")
    @Size(max = 50, message = "Assignment type cannot exceed 50 characters")
    private String type;

    /**
     * Start date
     */
    @Schema(description = "Assignment start date", example = "2024-03-01T09:00:00")
    @NotNull(message = "Start date cannot be null")
    private LocalDateTime startDate;

    /**
     * End date
     */
    @Schema(description = "Assignment end date", example = "2024-03-15T23:59:59")
    @NotNull(message = "End date cannot be null")
    private LocalDateTime endDate;

    /**
     * Assignment weight (0.0 to 100.0)
     */
    @Schema(description = "Assignment weight (0.0 to 100.0)", example = "25.0")
    @NotNull(message = "Assignment weight cannot be null")
    @DecimalMin(value = "0.0", message = "Weight must be greater than or equal to 0.0")
    @DecimalMax(value = "100.0", message = "Weight must be less than or equal to 100.0")
    private Double weight;

    /**
     * Assignment progress (0.0 to 100.0)
     */
    @Schema(description = "Assignment progress (0.0 to 100.0)", example = "0.0", defaultValue = "0.0")
    @DecimalMin(value = "0.0", message = "Progress must be greater than or equal to 0.0")
    @DecimalMax(value = "100.0", message = "Progress must be less than or equal to 100.0")
    private Double progress = 0.0;

    /**
     * Assignment status
     */
    @Schema(description = "Assignment status", example = "PENDING", allowableValues = {"PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"}, defaultValue = "PENDING")
    @NotBlank(message = "Assignment status cannot be blank")
    @Size(max = 20, message = "Assignment status cannot exceed 20 characters")
    private String status = "PENDING";

    /**
     * Rubric meta information (JSON string)
     * Contains: name, description, totalPoints
     */
    @Schema(description = "Rubric meta information")
    private RubricMetaInfo rubricMetaInfo;

    /**
     * Rubrics information list
     */
    @Schema(description = "List of rubric criteria")
    private List<RubricsInfoDto> rubricsInfo;
}
