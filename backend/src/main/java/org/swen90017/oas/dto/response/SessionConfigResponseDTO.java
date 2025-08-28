package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Session configuration response DTO")
public class SessionConfigResponseDTO {

    @Schema(description = "Assignment ID", example = "123")
    private Long assignmentId;

    @Schema(description = "Session length in minutes", example = "30")
    private Integer sessionLength;

    @Schema(description = "Gap time between sessions in minutes", example = "5")
    private Integer gapTime;

    @Schema(description = "Number of examiners required per session", example = "2")
    private Integer examinersPerSession;

    @Schema(description = "Default maximum sessions per examiner (0 means unlimited)", example = "40")
    private Integer defaultMaxSessionsPerExaminer;

    @Schema(description = "Whether the configuration is completed", example = "true")
    private Boolean isConfigured;

    @Schema(description = "Last modification time", example = "2025-08-26T10:30:00")
    private LocalDateTime lastModified;

    @Schema(description = "Updated by user ID", example = "1")
    private Long updatedBy;
}
