package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CSV Import History Entity
 * Stores information about each CSV import operation
 */
@Schema(description = "CSV import history record")
@Data
@TableName("csv_import_history")
public class CsvImportHistory {

    /**
     * Primary Key
     */
    @Schema(description = "History record ID", example = "1")
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * Import type: student, group, mix, examiner
     */
    @Schema(description = "Import type", example = "student")
    @TableField("import_type")
    private String importType;

    /**
     * Assignment ID (if applicable)
     */
    @Schema(description = "Assignment ID", example = "1")
    @TableField("assignment_id")
    private Long assignmentId;

    /**
     * Original filename
     */
    @Schema(description = "Original filename", example = "students.csv")
    @TableField("original_filename")
    private String originalFilename;

    /**
     * Saved filename (renamed with type_importer_timestamp format)
     */
    @Schema(description = "Saved filename", example = "student_admin_20231008_143025.csv")
    @TableField("saved_filename")
    private String savedFilename;

    /**
     * File path on server
     */
    @Schema(description = "File path on server", example = "/csv-imports/student_admin_20231008_143025.csv")
    @TableField("file_path")
    private String filePath;

    /**
     * File size in bytes
     */
    @Schema(description = "File size in bytes", example = "2048")
    @TableField("file_size")
    private Long fileSize;

    /**
     * Number of records imported
     */
    @Schema(description = "Number of records imported", example = "50")
    @TableField("record_count")
    private Integer recordCount;

    /**
     * Import status: success, failed
     */
    @Schema(description = "Import status", example = "success")
    @TableField("import_status")
    private String importStatus;

    /**
     * Error message (if failed)
     */
    @Schema(description = "Error message if import failed")
    @TableField("error_message")
    private String errorMessage;

    /**
     * Importer user ID
     */
    @Schema(description = "Importer user ID", example = "1")
    @TableField("importer_id")
    private Long importerId;

    /**
     * Importer username
     */
    @Schema(description = "Importer username", example = "admin")
    @TableField("importer_username")
    private String importerUsername;

    /**
     * Create time
     */
    @Schema(description = "Creation time", example = "2024-01-15T10:30:00")
    @TableField(value = "create_time")
    private LocalDateTime createTime;

    /**
     * Remarks
     */
    @Schema(description = "Remarks")
    @TableField("remarks")
    private String remarks;
}

