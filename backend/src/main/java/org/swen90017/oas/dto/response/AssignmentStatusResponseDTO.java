package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Assignment Status Response DTO
 * Used for the dedicated assignment status endpoint
 */
@Schema(description = "Assignment status response")
@Data
public class AssignmentStatusResponseDTO {

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "42")
    private Long assignmentId;

    /**
     * Setup status information
     */
    @Schema(description = "Setup status details")
    private AssignmentSetupStatusDTO setupStatus;
}
