package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Release schedule response DTO")
public class ReleaseScheduleResponseDTO {

    @Schema(description = "Release date/time", example = "2025-08-26T11:00:00")
    private LocalDateTime releasedAt;

    @Schema(description = "Notifications sent")
    private NotificationsSentDTO notificationsSent;

    @Schema(description = "Success message", example = "Schedule released successfully")
    private String message;

    @Data
    @Schema(description = "Notifications sent")
    public static class NotificationsSentDTO {
        
        @Schema(description = "Number of students notified", example = "45")
        private Integer students;

        @Schema(description = "Number of examiners notified", example = "6")
        private Integer examiners;
    }
}
