package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CSV Import History Response DTO
 */
@Schema(description = "CSV import history response")
@Data
public class CsvImportHistoryDTO {

    @Schema(description = "History record ID", example = "1")
    private Long id;

    @Schema(description = "Import type", example = "student")
    private String importType;

    @Schema(description = "Assignment ID", example = "1")
    private Long assignmentId;

    @Schema(description = "Assignment name", example = "Oral Presentation")
    private String assignmentName;

    @Schema(description = "Subject name", example = "SWEN90017")
    private String subjectName;

    @Schema(description = "Original filename", example = "students.csv")
    private String originalFilename;

    @Schema(description = "Saved filename", example = "student_admin_20231008_143025.csv")
    private String savedFilename;

    @Schema(description = "File size in bytes", example = "2048")
    private Long fileSize;

    @Schema(description = "Number of records imported", example = "50")
    private Integer recordCount;

    @Schema(description = "Import status", example = "success")
    private String importStatus;

    @Schema(description = "Error message if import failed")
    private String errorMessage;

    @Schema(description = "Importer user ID", example = "1")
    private Long importerId;

    @Schema(description = "Importer username", example = "admin")
    private String importerUsername;

    @Schema(description = "Creation time", example = "2024-01-15T10:30:00")
    private LocalDateTime createTime;

    @Schema(description = "Remarks")
    private String remarks;
}

