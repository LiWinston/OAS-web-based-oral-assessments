package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@Schema(description = "Session configuration request DTO")
public class SessionConfigRequestDTO {

    @Schema(description = "Session length in minutes", example = "30")
    @NotNull(message = "Session length cannot be null")
    @Min(value = 1, message = "Session length must be greater than 0")
    private Integer sessionLength;

    @Schema(description = "Gap time between sessions in minutes", example = "5")
    @NotNull(message = "Gap time cannot be null")
    @Min(value = 0, message = "Gap time cannot be negative")
    private Integer gapTime;

    @Schema(description = "Number of examiners required per session", example = "2")
    @NotNull(message = "Examiners per session cannot be null")
    @Min(value = 1, message = "Examiners per session must be greater than 0")
    private Integer examinersPerSession;

    @Schema(description = "Default maximum sessions per examiner (0 means unlimited)", example = "40")
    @Min(value = 0, message = "Maximum sessions per examiner cannot be negative")
    private Integer defaultMaxSessionsPerExaminer = 0;
}
