package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Course List Response DTO
 * Used for returning paginated course list
 */
@Schema(description = "Paginated course list response")
@Data
public class CourseListResponseDTO {

    /**
     * Course list data
     */
    @Schema(description = "List of courses")
    private List<CourseResponseDTO> data;

    /**
     * Success flag
     */
    @Schema(description = "Success flag", example = "true")
    private Boolean success;

    /**
     * Total number of records
     */
    @Schema(description = "Total number of records", example = "25")
    private Long total;

    /**
     * Current page number
     */
    @Schema(description = "Current page number", example = "1")
    private Long current;

    /**
     * Page size
     */
    @Schema(description = "Page size", example = "10")
    private Long size;

    /**
     * Constructor
     */
    public CourseListResponseDTO(List<CourseResponseDTO> data, Long total, Long current, Long size) {
        this.data = data;
        this.success = true;
        this.total = total;
        this.current = current;
        this.size = size;
    }
}
