package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Subject Entity
 * User Story 4.1: Set up academic periods (year, semester, subject)
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
     * Semester ID (logical reference to semester table)
     */
    @TableField("semester_id")
    private Long semesterId;

    /**
     * Subject code (e.g., "SWEN90017")
     */
    @TableField("subject_code")
    private String subjectCode;

    /**
     * Subject name
     */
    @TableField("subject_name")
    private String subjectName;

    /**
     * Subject description
     */
    @TableField("description")
    private String description;

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
