package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Course Create Request DTO
 * Used for creating new courses
 */
@Schema(description = "Course creation request data")
@Data
public class CourseCreateRequestDTO {

    /**
     * Course code
     */
    @Schema(description = "Course code (e.g., SWEN90017, COMP90082)", example = "SWEN90017")
    @NotBlank(message = "Course code cannot be blank")
    private String courseCode;

    /**
     * Course name
     */
    @Schema(description = "Course name", example = "Software Engineering Project Management")
    @NotBlank(message = "Course name cannot be blank")
    private String courseName;

    /**
     * Course description
     */
    @Schema(description = "Course description", example = "Master-level software engineering project management course")
    private String description;

    /**
     * Academic year
     */
    @Schema(description = "Academic year", example = "2024")
    @NotNull(message = "Academic year cannot be null")
    private Integer academicYear;

    /**
     * Semester
     */
    @Schema(description = "Semester (1, 2, summer)", example = "1")
    @NotBlank(message = "Semester cannot be blank")
    private String semester;

    /**
     * Administrator user ID
     */
    @Schema(description = "Administrator user ID", example = "1")
    @NotNull(message = "Admin user ID cannot be null")
    private Long adminUserId;

    /**
     * Course status (default: active)
     */
    @Schema(description = "Course status", example = "active", defaultValue = "active")
    private String status = "active";
}
