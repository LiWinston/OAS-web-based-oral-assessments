package org.swen90017.oas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * Subject/Course DTO (Simplified for Frontend Compatibility)
 * Matches frontend expectations for course management
 */
@Schema(description = "Subject/Course data transfer object")
@Data
public class SubjectDto {

    /**
     * Subject ID (for update operations)
     */
    @Schema(description = "Subject ID (for update operations)", example = "1")
    private Long subjectId;

    /**
     * Subject code (e.g., "SWEN90017", "COMP90082")
     */
    @Schema(description = "Subject code", example = "SWEN90017")
    @NotBlank(message = "Subject code cannot be blank")
    private String subjectCode;

    /**
     * Subject name (Course name for frontend)
     */
    @Schema(description = "Subject name", example = "Software Engineering Project Management")
    @NotBlank(message = "Subject name cannot be blank")
    private String subjectName;

    /**
     * Subject description
     */
    @Schema(description = "Subject description", example = "Master-level software engineering project management course")
    private String description;

    /**
     * Academic year (e.g., 2024, 2025)
     */
    @Schema(description = "Academic year", example = "2024")
    @NotNull(message = "Academic year cannot be null")
    private Integer academicYear;

    /**
     * Semester (e.g., "1", "2", "summer")
     */
    @Schema(description = "Semester", example = "1")
    @NotBlank(message = "Semester cannot be blank")
    private String semester;

    /**
     * Administrator user ID
     */
    @Schema(description = "Administrator user ID", example = "1")
    @NotNull(message = "Admin user ID cannot be null")
    private Long adminUserId;

    /**
     * Is active
     */
    @Schema(description = "Is active", example = "true", defaultValue = "true")
    private Boolean isActive = true;

    /**
     * Status (active, archived, etc.)
     */
    @Schema(description = "Status", example = "active", defaultValue = "active")
    private String status = "active";
}
