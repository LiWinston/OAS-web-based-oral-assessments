package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Student Assignment List Response DTO
 * Used for returning paginated list of student assignments
 */
@Schema(description = "Paginated student assignment list response")
@Data
public class StudentAssignmentListResponseDTO {

    /**
     * Page number (0-based)
     */
    @Schema(description = "Page number (0-based)", example = "0")
    private Integer pageNum;

    /**
     * Page size
     */
    @Schema(description = "Page size", example = "20")
    private Integer pageSize;

    /**
     * Total number of records
     */
    @Schema(description = "Total number of records", example = "1")
    private Long total;

    /**
     * List of student assignments
     */
    @Schema(description = "List of student assignments")
    private List<StudentAssignmentResponseDTO> data;
}
