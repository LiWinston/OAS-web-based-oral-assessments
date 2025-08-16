package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Subject/Course Entity (Simplified for Frontend Compatibility)
 * Contains embedded academic year and semester information
 */
@Schema(description = "Subject/Course entity")
@Data
@TableName("subject")
public class Subject {

    /**
     * Subject ID
     */
    @Schema(description = "Subject ID", example = "1")
    @TableId(value = "subject_id", type = IdType.AUTO)
    private Long subjectId;

    /**
     * Subject code (e.g., "SWEN90017", "COMP90082")
     */
    @Schema(description = "Subject code", example = "SWEN90017")
    @TableField("subject_code")
    private String subjectCode;

    /**
     * Subject name (Course name for frontend)
     */
    @Schema(description = "Subject name", example = "Software Engineering Project Management")
    @TableField("subject_name")
    private String subjectName;

    /**
     * Subject description
     */
    @Schema(description = "Subject description", example = "Master-level software engineering project management course")
    @TableField("description")
    private String description;

    /**
     * Academic year (e.g., 2024, 2025)
     */
    @Schema(description = "Academic year", example = "2024")
    @TableField("academic_year")
    private Integer academicYear;

    /**
     * Semester (e.g., "1", "2", "summer")
     */
    @Schema(description = "Semester", example = "1")
    @TableField("semester")
    private String semester;

    /**
     * Administrator user ID (logical reference to sys_user table)
     */
    @Schema(description = "Administrator user ID", example = "1")
    @TableField("admin_user_id")
    private Long adminUserId;

    /**
     * Is active (1: active, 0: inactive)
     */
    @Schema(description = "Is active", example = "true")
    @TableField("is_active")
    private Boolean isActive;

    /**
     * Status (active, archived, etc.)
     */
    @Schema(description = "Status", example = "active")
    @TableField("status")
    private String status;

    /**
     * Create time
     */
    @Schema(description = "Create time", example = "2024-01-15T10:30:00")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * Creator user ID (logical reference)
     */
    @Schema(description = "Creator user ID", example = "1")
    @TableField(value = "creator", fill = FieldFill.INSERT)
    private Long creator;

    /**
     * Update time
     */
    @Schema(description = "Update time", example = "2024-01-20T14:45:00")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * Updater user ID (logical reference)
     */
    @Schema(description = "Updater user ID", example = "1")
    @TableField(value = "updater", fill = FieldFill.INSERT_UPDATE)
    private Long updater;
}
