package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Wrapper for listing assignment members with pagination.
 */
@Data
public class AssignmentMemberListResponseDTO {

    @Schema(description = "Zero-based page number", example = "0")
    private Integer pageNum;

    @Schema(description = "Page size", example = "25")
    private Integer pageSize;

    @Schema(description = "Total items", example = "100")
    private Long total;

    @Schema(description = "Member rows")
    private List<AssignmentMemberResponseDTO> data;
}


