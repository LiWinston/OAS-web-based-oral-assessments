package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Course List Response DTO
 * Used for returning paginated course list
 */
@Data
public class CourseListResponseDTO {

    /**
     * Course list data
     */
    private List<CourseResponseDTO> data;

    /**
     * Success flag
     */
    private Boolean success;

    /**
     * Total number of records
     */
    private Long total;

    /**
     * Current page number
     */
    private Long current;

    /**
     * Page size
     */
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
