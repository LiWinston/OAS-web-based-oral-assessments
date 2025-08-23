package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Course Response DTO
 * Used for returning course information
 */
@Schema(description = "Course response data")
@Data
public class CourseResponseDTO {

    /**
     * Course ID
     */
    @Schema(description = "Course ID", example = "1")
    private Long id;

    /**
     * Course code
     */
    @Schema(description = "Course code", example = "SWEN90017")
    private String courseCode;

    /**
     * Course name
     */
    @Schema(description = "Course name", example = "Software Engineering Project Management")
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
    private Integer academicYear;

    /**
     * Semester
     */
    @Schema(description = "Semester", example = "1")
    private String semester;

    /**
     * Administrator user ID
     */
    @Schema(description = "Administrator user ID", example = "1")
    private Long adminUserId;

    /**
     * Whether the course is active
     */
    @Schema(description = "Whether the course is active", example = "true")
    private Boolean isActive;

    /**
     * Course status
     */
    @Schema(description = "Course status", example = "active")
    private String status;

    /**
     * Number of students enrolled
     */
    @Schema(description = "Number of students enrolled", example = "25")
    private Integer students;

    /**
     * Number of assignments
     */
    @Schema(description = "Number of assignments", example = "3")
    private Integer assignments;

    /**
     * Create time
     */
    @Schema(description = "Create time", example = "2024-01-15T10:30:00")
    private LocalDateTime createTime;

    /**
     * Creator user ID
     */
    @Schema(description = "Creator user ID", example = "1")
    private Long creator;

    /**
     * Update time
     */
    @Schema(description = "Update time", example = "2024-01-20T14:45:00")
    private LocalDateTime updateTime;

    /**
     * Updater user ID
     */
    @Schema(description = "Updater user ID", example = "1")
    private Long updater;
}
