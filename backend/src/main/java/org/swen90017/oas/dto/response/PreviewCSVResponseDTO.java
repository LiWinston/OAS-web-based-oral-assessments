package org.swen90017.oas.dto.response;

import lombok.Data;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;

import java.util.List;

/**
 * DTO for CSV import preview response
 * Contains information about new and existing students from the CSV file
 */
@Data
public class PreviewCSVResponseDTO {
    /**
     * List of students that are not in the database and will be added
     */
    private List<StudentCSVRequestDTO> newStudents;

    /**
     * List of students that already exist in the database
     */
    private List<StudentCSVRequestDTO> existingStudents;

    /**
     * Total number of records in the CSV file
     */
    private int totalCount;

    /**
     * Number of new students to be added
     */
    private int newCount;

    /**
     * Number of students that already exist in the database
     */
    private int existingCount;
} 