package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;

/**
 * Student Assignment Query Request DTO
 * Used for querying student assignments with filters and pagination
 */
@Schema(description = "Student assignment query request with filters and pagination")
@Data
public class StudentAssignmentQueryRequestDTO {

    /**
     * Assignment status filter
     */
    @Schema(description = "Assignment status filter", example = "bookable", allowableValues = {"bookable", "booked", "all"})
    private String status;

    /**
     * Page number (0-based)
     */
    @Schema(description = "Page number (0-based)", example = "0", defaultValue = "0")
    @Min(value = 0, message = "Page number must be 0 or greater")
    private Integer pageNum = 0;

    /**
     * Page size
     */
    @Schema(description = "Page size", example = "20", defaultValue = "20")
    @Min(value = 1, message = "Page size must be greater than 0")
    private Integer pageSize = 20;

    /**
     * Sort order
     */
    @Schema(description = "Sort order", example = "date_asc", allowableValues = {"date_asc", "date_desc"}, defaultValue = "date_asc")
    private String sort = "date_asc";
}
