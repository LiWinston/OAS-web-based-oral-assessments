package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;

@Schema(description = "Super Admin course list query request")
@Data
public class SuperAdminCourseQueryRequestDTO {

    @Schema(description = "Page number", example = "1", defaultValue = "1")
    @Min(value = 1, message = "Page number must be >= 1")
    private Integer page = 1;

    @Schema(description = "Items per page", example = "20", defaultValue = "20")
    @Min(value = 1, message = "Items per page must be >= 1")
    private Integer limit = 20;

    @Schema(description = "Filter by status (ACTIVE/INACTIVE/ARCHIVED)")
    private String status;

    @Schema(description = "Filter by department")
    private String department;

    @Schema(description = "Filter by semester (1/2/summer or 'Semester 1')")
    private String semester;

    @Schema(description = "Filter by year", example = "2025")
    private Integer year;

    @Schema(description = "Search by course code or name")
    private String search;

    @Schema(description = "Filter by Course Admin user id")
    private Long adminId;

    @Schema(description = "Sort field", example = "createdAt", defaultValue = "createdAt")
    private String sortBy = "createdAt";

    @Schema(description = "Sort order", example = "desc", defaultValue = "desc")
    private String sortOrder = "desc";
}


