package org.swen90017.oas.dto.response;

import lombok.Data;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;

import java.util.List;
import java.io.Serializable;

/**
 * DTO for Group CSV import preview response
 * Contains information about new and existing students from the Group CSV file
 */
@Data
public class GroupPreviewCSVResponseDTO implements Serializable {
    /**
     * List of group records that contain students not in the database and will be added
     */
    private List<GroupCSVRequestDTO> newStudentRecords;

    /**
     * List of group records that contain students already exist in the database
     */
    private List<GroupCSVRequestDTO> existingStudentRecords;

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

    /**
     * Number of unique groups in the CSV file
     */
    private int groupCount;
} 