package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;

/**
 * Course Query Request DTO
 * Used for querying courses with pagination and filters
 */
@Schema(description = "Course query request with pagination and filters")
@Data
public class CourseQueryRequestDTO {

    /**
     * Page number (starting from 1)
     */
    @Schema(description = "Page number (starting from 1)", example = "1", defaultValue = "1")
    @Min(value = 1, message = "Page number must be greater than 0")
    private Integer pageNum = 1;

    /**
     * Page size
     */
    @Schema(description = "Page size", example = "10", defaultValue = "10")
    @Min(value = 1, message = "Page size must be greater than 0")
    private Integer pageSize = 10;

    /**
     * Academic year filter
     */
    @Schema(description = "Academic year filter", example = "2024")
    private Integer year;

    /**
     * Semester filter
     */
    @Schema(description = "Semester filter (1, 2, summer)", example = "1")
    private String semester;
    
    /**
     * Is active filter
     */
    @Schema(description = "Is active filter", example = "true")
    private Boolean isActive;

    /**
     * Course status filter
     */
    @Schema(description = "Course status filter (active, archived)", example = "active")
    private String status;

    /**
     * Course code filter
     */
    @Schema(description = "Course code filter", example = "SWEN90017")
    private String courseCode;

    /**
     * Admin user ID filter
     */
    @Schema(description = "Admin user ID filter", example = "1")
    private Long adminUserId;
}
