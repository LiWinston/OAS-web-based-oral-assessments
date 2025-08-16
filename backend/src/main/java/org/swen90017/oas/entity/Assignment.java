package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Assignment Entity
 * Represents an assignment in the system
 */
@Schema(description = "Assignment entity")
@Data
@TableName("assignment")
public class Assignment {

    /**
     * Assignment ID (Primary Key)
     */
    @Schema(description = "Assignment ID", example = "1")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * Subject ID (Foreign Key to subject table)
     */
    @Schema(description = "Subject ID", example = "1")
    @TableField("subject_id")
    private Long subjectId;

    /**
     * Assignment name
     */
    @Schema(description = "Assignment name", example = "Oral Presentation")
    @TableField("name")
    private String name;

    /**
     * Assignment description
     */
    @Schema(description = "Assignment description", example = "Individual oral presentation on project progress")
    @TableField("description")
    private String description;

    /**
     * Assignment type
     */
    @Schema(description = "Assignment type", example = "individual", allowableValues = {"individual", "group", "mixed"})
    @TableField("type")
    private String type;

    /**
     * Start date
     */
    @Schema(description = "Assignment start date", example = "2024-03-01T09:00:00")
    @TableField("start_date")
    private LocalDateTime startDate;

    /**
     * End date
     */
    @Schema(description = "Assignment end date", example = "2024-03-15T23:59:59")
    @TableField("end_date")
    private LocalDateTime endDate;

    /**
     * Assignment weight
     */
    @Schema(description = "Assignment weight (0.0 to 100.0)", example = "25.0")
    @TableField("weight")
    private Double weight;

    /**
     * Assignment progress
     */
    @Schema(description = "Assignment progress (0.0 to 100.0)", example = "50.0")
    @TableField("progress")
    private Double progress;

    /**
     * Assignment status
     */
    @Schema(description = "Assignment status", example = "IN_PROGRESS", allowableValues = {"PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"})
    @TableField("status")
    private String status;

    /**
     * Rubric meta information (JSON string)
     * Contains: name, description, totalPoints
     */
    @Schema(description = "Rubric meta information (JSON)", example = "{\"name\":\"Oral Presentation Rubric\",\"description\":\"Evaluation criteria\",\"totalPoints\":100}")
    @TableField("rubric_meta_info")
    private String rubricMetaInfo;

    /**
     * Rubrics information (JSON string)
     * Contains: description, weight, scaleType, performanceLevels
     */
    @Schema(description = "Rubrics information (JSON)")
    @TableField("rubrics_info")
    private String rubricsInfo;

    /**
     * Creator user ID
     */
    @Schema(description = "Creator user ID", example = "1")
    @TableField(value = "creator", fill = FieldFill.INSERT)
    private Long creator;

    /**
     * Updater user ID
     */
    @Schema(description = "Updater user ID", example = "1")
    @TableField(value = "updater", fill = FieldFill.INSERT_UPDATE)
    private Long updater;

    /**
     * Create time
     */
    @Schema(description = "Create time", example = "2024-01-15T10:30:00")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * Update time
     */
    @Schema(description = "Update time", example = "2024-01-20T14:45:00")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
