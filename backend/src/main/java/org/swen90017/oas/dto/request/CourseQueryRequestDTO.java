package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.Min;

/**
 * Course Query Request DTO
 * Used for querying courses with pagination and filters
 */
@Data
public class CourseQueryRequestDTO {

    /**
     * Page number (starting from 1)
     */
    @Min(value = 1, message = "Page number must be greater than 0")
    private Integer pageNum = 1;

    /**
     * Page size
     */
    @Min(value = 1, message = "Page size must be greater than 0")
    private Integer pageSize = 10;

    /**
     * Academic year filter
     */
    private Integer year;

    /**
     * Semester filter
     */
    private String semester;

    /**
     * Course status filter
     */
    private String status;

    /**
     * Course code filter
     */
    private String courseCode;

    /**
     * Admin user ID filter
     */
    private Long adminUserId;
}
