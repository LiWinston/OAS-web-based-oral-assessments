package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Subject/Course Entity (Simplified for Frontend Compatibility)
 * Contains embedded academic year and semester information
 */
@Data
@TableName("subject")
public class Subject {

    /**
     * Subject ID
     */
    @TableId(value = "subject_id", type = IdType.AUTO)
    private Long subjectId;

    /**
     * Subject code (e.g., "SWEN90017", "COMP90082")
     */
    @TableField("subject_code")
    private String subjectCode;

    /**
     * Subject name (Course name for frontend)
     */
    @TableField("subject_name")
    private String subjectName;

    /**
     * Subject description
     */
    @TableField("description")
    private String description;

    /**
     * Academic year (e.g., 2024, 2025)
     */
    @TableField("academic_year")
    private Integer academicYear;

    /**
     * Semester (e.g., "1", "2", "summer")
     */
    @TableField("semester")
    private String semester;

    /**
     * Administrator user ID (logical reference to sys_user table)
     */
    @TableField("admin_user_id")
    private Long adminUserId;

    /**
     * Is active (1: active, 0: inactive)
     */
    @TableField("is_active")
    private Boolean isActive;

    /**
     * Status (active, archived, etc.)
     */
    @TableField("status")
    private String status;

    /**
     * Create time
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * Creator user ID (logical reference)
     */
    @TableField(value = "creator", fill = FieldFill.INSERT)
    private Long creator;

    /**
     * Update time
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * Updater user ID (logical reference)
     */
    @TableField(value = "updater", fill = FieldFill.INSERT_UPDATE)
    private Long updater;
}
