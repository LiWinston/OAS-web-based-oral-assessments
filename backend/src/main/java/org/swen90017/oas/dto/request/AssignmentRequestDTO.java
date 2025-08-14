package org.swen90017.oas.dto.request;

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
    @Size(max = 255, message = "Assignment name cannot exceed 255 characters")
    private String name;

    /**
     * Assignment description
     */
    private String description;

    /**
     * Assignment type (individual, group, mixed)
     */
    @NotBlank(message = "Assignment type cannot be blank")
    @Size(max = 50, message = "Assignment type cannot exceed 50 characters")
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
     * Assignment progress (0.0 to 100.0)
     */
    @DecimalMin(value = "0.0", message = "Progress must be greater than or equal to 0.0")
    @DecimalMax(value = "100.0", message = "Progress must be less than or equal to 100.0")
    private Double progress = 0.0;

    /**
     * Assignment status
     */
    @NotBlank(message = "Assignment status cannot be blank")
    @Size(max = 20, message = "Assignment status cannot exceed 20 characters")
    private String status = "PENDING";

    /**
     * Rubric meta information (JSON string)
     * Contains: name, description, totalPoints
     */
    private RubricMetaInfo rubricMetaInfo;

    /**
     * Rubrics information list
     */
    private List<RubricsInfoDto> rubricsInfo;
}
