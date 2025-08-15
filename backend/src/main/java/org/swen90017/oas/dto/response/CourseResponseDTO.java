package org.swen90017.oas.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Course Response DTO
 * Used for returning course information
 */
@Data
public class CourseResponseDTO {

    /**
     * Course ID
     */
    private Long id;

    /**
     * Course code
     */
    private String courseCode;

    /**
     * Course name
     */
    private String courseName;

    /**
     * Course description
     */
    private String description;

    /**
     * Academic year
     */
    private Integer academicYear;

    /**
     * Semester
     */
    private String semester;

    /**
     * Administrator user ID
     */
    private Long adminUserId;

    /**
     * Whether the course is active
     */
    private Boolean isActive;

    /**
     * Course status
     */
    private String status;

    /**
     * Number of students enrolled
     */
    private Integer students;

    /**
     * Number of assignments
     */
    private Integer assignments;

    /**
     * Create time
     */
    private LocalDateTime createTime;

    /**
     * Creator user ID
     */
    private Long creator;

    /**
     * Update time
     */
    private LocalDateTime updateTime;

    /**
     * Updater user ID
     */
    private Long updater;
}
