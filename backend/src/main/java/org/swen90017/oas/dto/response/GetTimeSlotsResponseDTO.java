package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Get time slots response DTO")
public class GetTimeSlotsResponseDTO {

    @Schema(description = "List of time slots")
    private List<TimeSlotDetailDTO> timeSlots;

    @Schema(description = "Time slots summary")
    private TimeSlotsSummaryDTO summary;

    @Data
    @Schema(description = "Time slots summary")
    public static class TimeSlotsSummaryDTO {
        
        @Schema(description = "Total number of time slots", example = "4")
        private Integer totalTimeSlots;

        @Schema(description = "Total number of sessions", example = "12")
        private Integer totalSessions;

        @Schema(description = "Number of fully staffed slots", example = "2")
        private Integer fullyStaffed;

        @Schema(description = "Number of partially staffed slots", example = "1")
        private Integer partiallyStaffed;

        @Schema(description = "Number of unstaffed slots", example = "1")
        private Integer unstaffed;
    }
}
