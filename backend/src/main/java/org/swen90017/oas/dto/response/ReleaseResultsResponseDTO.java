package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Release Results Response DTO
 * Response for releasing assignment results
 */
@Schema(description = "Response for results release operation")
@Data
public class ReleaseResultsResponseDTO {

    /**
     * Whether the operation was successful
     */
    @Schema(description = "Operation success status", example = "true")
    private Boolean success;

    /**
     * When the results were released
     */
    @Schema(description = "Results release timestamp", example = "2025-09-20T10:30:00")
    private LocalDateTime releasedOn;

    /**
     * Number of students notified (if notifications were sent)
     */
    @Schema(description = "Number of students notified", example = "25")
    private Integer studentsNotified;
}
