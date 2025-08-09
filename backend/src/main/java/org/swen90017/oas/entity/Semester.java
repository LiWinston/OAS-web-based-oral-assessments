package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Semester Entity
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Data
@TableName("semester")
public class Semester {

    /**
     * Semester ID
     */
    @TableId(value = "semester_id", type = IdType.AUTO)
    private Long semesterId;

    /**
     * Academic year ID (logical reference to academic_year table)
     */
    @TableField("academic_year_id")
    private Long academicYearId;

    /**
     * Semester name (e.g., "Semester 1", "Semester 2", "Summer")
     */
    @TableField("semester_name")
    private String semesterName;

    /**
     * Semester code (e.g., "S1", "S2", "SU")
     */
    @TableField("semester_code")
    private String semesterCode;

    /**
     * Semester start date
     */
    @TableField("start_date")
    private LocalDate startDate;

    /**
     * Semester end date
     */
    @TableField("end_date")
    private LocalDate endDate;

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
