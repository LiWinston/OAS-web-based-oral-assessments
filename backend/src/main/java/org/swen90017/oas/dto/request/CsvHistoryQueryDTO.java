package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * CSV Import History Query Request DTO
 */
@Schema(description = "CSV import history query request")
@Data
public class CsvHistoryQueryDTO {

    @Schema(description = "Import type", example = "student")
    private String importType;

    @Schema(description = "Assignment ID", example = "1")
    private Long assignmentId;

    @Schema(description = "Importer user ID", example = "1")
    private Long importerId;

    @Schema(description = "Import status", example = "success")
    private String importStatus;

    @Schema(description = "Page number", example = "1")
    private Integer pageNum;

    @Schema(description = "Page size", example = "10")
    private Integer pageSize;
}

