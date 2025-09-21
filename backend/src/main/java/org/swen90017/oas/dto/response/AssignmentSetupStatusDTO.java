package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Assignment Setup Status DTO
 * Contains the three-step setup progress information for assignments
 */
@Schema(description = "Assignment setup status information")
@Data
public class AssignmentSetupStatusDTO {

    /**
     * Whether the rubric has been configured and published
     */
    @Schema(description = "Whether rubric is configured", example = "true")
    private Boolean rubricConfigured;

    /**
     * Whether time slots have been configured
     */
    @Schema(description = "Whether time slots are configured", example = "false")
    private Boolean timeSlotsConfigured;

    /**
     * Whether results have been released to students
     */
    @Schema(description = "Whether results are released", example = "false")
    private Boolean resultsReleased;

    /**
     * Overall progress percentage (0, 33, 66, or 100)
     */
    @Schema(description = "Setup progress percentage", example = "33")
    private Integer progress;

    /**
     * When results were released (if applicable)
     */
    @Schema(description = "Results release timestamp", example = "2025-06-12T13:00:00")
    private LocalDateTime releasedOn;

    /**
     * Last update timestamp for the setup status
     */
    @Schema(description = "Last status update timestamp", example = "2025-09-20T10:30:00")
    private LocalDateTime lastUpdated;

    /**
     * Calculate progress based on the three boolean flags
     */
    public void calculateProgress() {
        int completedSteps = 0;
        if (Boolean.TRUE.equals(rubricConfigured)) completedSteps++;
        if (Boolean.TRUE.equals(timeSlotsConfigured)) completedSteps++;
        if (Boolean.TRUE.equals(resultsReleased)) completedSteps++;
        
        this.progress = completedSteps * 33;
        if (completedSteps == 3) {
            this.progress = 100; // Ensure 100% when all steps are complete
        }
    }
}
