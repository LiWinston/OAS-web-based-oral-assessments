package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Course Create Request DTO
 * Used for creating new courses
 */
@Data
public class CourseCreateRequestDTO {

    /**
     * Course code
     */
    @NotBlank(message = "Course code cannot be blank")
    private String courseCode;

    /**
     * Course name
     */
    @NotBlank(message = "Course name cannot be blank")
    private String courseName;

    /**
     * Course description
     */
    private String description;

    /**
     * Academic year
     */
    @NotNull(message = "Academic year cannot be null")
    private Integer academicYear;

    /**
     * Semester
     */
    @NotBlank(message = "Semester cannot be blank")
    private String semester;

    /**
     * Administrator user ID
     */
    @NotNull(message = "Admin user ID cannot be null")
    private Long adminUserId;

    /**
     * Course status (default: active)
     */
    private String status = "active";
}
