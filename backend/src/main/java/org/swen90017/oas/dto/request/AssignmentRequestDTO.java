package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.DecimalMax;
import java.time.LocalDateTime;

/**
 * Assignment Request DTO
 * Used for creating and updating assignments
 */
@Data
public class AssignmentRequestDTO {

    /**
     * Assignment ID (for update operations)
     */
    private Long id;

    /**
     * Subject ID (Foreign Key to subject table)
     */
    @NotNull(message = "Subject ID cannot be null")
    private Long subjectId;

    /**
     * Assignment name
     */
    @NotBlank(message = "Assignment name cannot be blank")
    private String name;

    /**
     * Assignment description
     */
    private String description;

    /**
     * Assignment type
     */
    @NotBlank(message = "Assignment type cannot be blank")
    private String type;

    /**
     * Start date
     */
    @NotNull(message = "Start date cannot be null")
    private LocalDateTime startDate;

    /**
     * End date
     */
    @NotNull(message = "End date cannot be null")
    private LocalDateTime endDate;

    /**
     * Assignment weight (0.0 to 100.0)
     */
    @NotNull(message = "Assignment weight cannot be null")
    @DecimalMin(value = "0.0", message = "Weight must be greater than or equal to 0.0")
    @DecimalMax(value = "100.0", message = "Weight must be less than or equal to 100.0")
    private Double weight;

    /**
     * Assignment progress
     */
    private Double progress = 0.0;

    /**
     * Assignment status
     */
    private String status = "PENDING";

    /**
     * Rubric meta information (JSON string)
     * Contains: name, description, totalPoints
     */
    private String rubricMetaInfo;

    /**
     * Rubrics information (JSON string)
     * Contains: description, weight, scaleType, performanceLevels
     */
    private String rubricsInfo;
}
