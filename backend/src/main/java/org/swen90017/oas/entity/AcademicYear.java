package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Academic Year Entity
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Data
@TableName("academic_year")
public class AcademicYear {

    /**
     * Academic year ID
     */
    @TableId(value = "year_id", type = IdType.AUTO)
    private Long yearId;

    /**
     * Academic year value (e.g., "2024", "2025")
     */
    @TableField("year_value")
    private String yearValue;

    /**
     * Academic year start date
     */
    @TableField("start_date")
    private LocalDate startDate;

    /**
     * Academic year end date
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
