package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Release Results Request DTO
 * Used for releasing assignment results to students
 */
@Schema(description = "Request to release assignment results")
@Data
public class ReleaseResultsRequestDTO {

    /**
     * Whether to notify students about results release
     */
    @Schema(description = "Whether to notify students", example = "true")
    private Boolean notifyStudents = false;
}
