package org.swen90017.oas.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Subject/Course DTO (Simplified for Frontend Compatibility)
 * Matches frontend expectations for course management
 */
@Data
public class SubjectDto {

    /**
     * Subject ID (for update operations)
     */
    private Long subjectId;

    /**
     * Subject code (e.g., "SWEN90017", "COMP90082")
     */
    @NotBlank(message = "Subject code cannot be blank")
    private String subjectCode;

    /**
     * Subject name (Course name for frontend)
     */
    @NotBlank(message = "Subject name cannot be blank")
    private String subjectName;

    /**
     * Subject description
     */
    private String description;

    /**
     * Academic year (e.g., 2024, 2025)
     */
    @NotNull(message = "Academic year cannot be null")
    private Integer academicYear;

    /**
     * Semester (e.g., "1", "2", "summer")
     */
    @NotBlank(message = "Semester cannot be blank")
    private String semester;

    /**
     * Administrator user ID
     */
    @NotNull(message = "Admin user ID cannot be null")
    private Long adminUserId;

    /**
     * Is active
     */
    private Boolean isActive = true;

    /**
     * Status (active, archived, etc.)
     */
    private String status = "active";
}
