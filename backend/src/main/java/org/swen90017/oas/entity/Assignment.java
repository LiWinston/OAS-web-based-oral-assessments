package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Assignment Entity
 * Represents an assignment in the system
 */
@Data
@TableName("assignment")
public class Assignment {

    /**
     * Assignment ID (Primary Key)
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * Subject ID (Foreign Key to subject table)
     */
    @TableField("subject_id")
    private Long subjectId;

    /**
     * Assignment name
     */
    @TableField("name")
    private String name;

    /**
     * Assignment description
     */
    @TableField("description")
    private String description;

    /**
     * Assignment type
     */
    @TableField("type")
    private String type;

    /**
     * Start date
     */
    @TableField("start_date")
    private LocalDateTime startDate;

    /**
     * End date
     */
    @TableField("end_date")
    private LocalDateTime endDate;

    /**
     * Assignment weight
     */
    @TableField("weight")
    private Double weight;

    /**
     * Assignment progress
     */
    @TableField("progress")
    private Double progress;

    /**
     * Assignment status
     */
    @TableField("status")
    private String status;

    /**
     * Rubric meta information (JSON string)
     * Contains: name, description, totalPoints
     */
    @TableField("rubric_meta_info")
    private String rubricMetaInfo;

    /**
     * Rubrics information (JSON string)
     * Contains: description, weight, scaleType, performanceLevels
     */
    @TableField("rubrics_info")
    private String rubricsInfo;

    /**
     * Creator user ID
     */
    @TableField(value = "creator", fill = FieldFill.INSERT)
    private Long creator;

    /**
     * Updater user ID
     */
    @TableField(value = "updater", fill = FieldFill.INSERT_UPDATE)
    private Long updater;

    /**
     * Create time
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * Update time
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
