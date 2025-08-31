package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Assignment Status Statistics Response DTO
 * Contains statistics about assignment statuses
 */
@Schema(description = "Assignment status statistics response")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentStatusStatsResponseDTO {

    /**
     * Total number of assignments
     */
    @Schema(description = "Total number of assignments", example = "100")
    private Integer totalCount;

    /**
     * Count of assignments by status
     */
    @Schema(description = "Count of assignments by status", example = "{\"PENDING\": 20, \"IN_PROGRESS\": 30, \"COMPLETED\": 40, \"CANCELLED\": 10}")
    private Map<String, Integer> statusCounts;

    /**
     * Percentage of total weight by status (based on assignment weights, not counts)
     */
    @Schema(description = "Percentage of total weight by status (based on assignment weights)", example = "{\"PENDING\": 20.0, \"IN_PROGRESS\": 30.0, \"COMPLETED\": 40.0, \"CANCELLED\": 10.0}")
    private Map<String, Double> statusPercentages;
}
