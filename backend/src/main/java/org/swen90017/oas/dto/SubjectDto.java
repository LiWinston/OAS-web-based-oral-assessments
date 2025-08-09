package org.swen90017.oas.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Subject DTO
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Data
public class SubjectDto {

    /**
     * Subject ID (for update operations)
     */
    private Long subjectId;

    /**
     * Semester ID
     */
    @NotNull(message = "Semester ID cannot be null")
    private Long semesterId;

    /**
     * Subject code (e.g., "SWEN90017")
     */
    @NotBlank(message = "Subject code cannot be blank")
    private String subjectCode;

    /**
     * Subject name
     */
    @NotBlank(message = "Subject name cannot be blank")
    private String subjectName;

    /**
     * Subject description
     */
    private String description;

    /**
     * Administrator user ID
     */
    @NotNull(message = "Admin user ID cannot be null")
    private Long adminUserId;

    /**
     * Is active
     */
    private Boolean isActive = true;
}
