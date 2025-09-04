package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "Schedule status response DTO")
public class ScheduleStatusResponseDTO {

    @Schema(description = "Assignment ID", example = "123")
    private Long assignmentId;

    @Schema(description = "Schedule status", example = "draft", allowableValues = {"draft", "released"})
    private String scheduleStatus;

    @Schema(description = "Whether the schedule is released", example = "false")
    private Boolean isReleased;

    @Schema(description = "Release date/time", example = "null")
    private LocalDateTime releasedAt;

    @Schema(description = "Total number of time slots", example = "4")
    private Integer totalTimeSlots;

    @Schema(description = "Whether the schedule is ready for release", example = "true")
    private Boolean readyForRelease;

    @Schema(description = "Issues preventing release")
    private List<String> issues;

    @Schema(description = "Schedule summary")
    private ScheduleSummaryDTO summary;

    @Data
    @Schema(description = "Schedule summary")
    public static class ScheduleSummaryDTO {
        
        @Schema(description = "Total sessions", example = "12")
        private Integer totalSessions;

        @Schema(description = "Fully staffed slots", example = "2")
        private Integer fullyStaffedSlots;

        @Schema(description = "Unstaffed slots", example = "0")
        private Integer unstaffedSlots;

        @Schema(description = "Total examiners", example = "6")
        private Integer totalExaminers;
    }
}
