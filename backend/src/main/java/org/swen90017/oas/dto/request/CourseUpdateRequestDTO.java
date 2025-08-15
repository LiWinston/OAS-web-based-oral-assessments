package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Course Update Request DTO
 * Used for updating existing courses
 */
@Data
public class CourseUpdateRequestDTO {

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
     * Course status
     */
    private String status;

    /**
     * Whether the course is active
     */
    private Boolean isActive;
}
