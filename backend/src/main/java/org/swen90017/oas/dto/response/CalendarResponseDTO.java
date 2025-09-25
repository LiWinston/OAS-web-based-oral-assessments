package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@Schema(description = "Admin calendar aggregated view for a given month")
public class CalendarResponseDTO {

    @Schema(description = "Month in YYYY-MM format", example = "2025-08")
    private String month;

    @Schema(description = "Per-date calendar data keyed by YYYY-MM-DD")
    private Map<String, DateInfoDTO> dates;

    @Data
    @Schema(description = "Aggregated information for a specific date")
    public static class DateInfoDTO {
        @Schema(description = "Number of time slots on this date", example = "2")
        private Integer timeSlots;
        @Schema(description = "Total sessions on this date", example = "6")
        private Integer sessions;

        @Schema(description = "Count of fully staffed time slots on this date", example = "3")
        private Integer fullyStaffed;

        @Schema(description = "Count of partially staffed (>=50% but <100%) time slots on this date", example = "1")
        private Integer partialStaffed;

        @Schema(description = "Count of unstaffed time slots on this date", example = "2")
        private Integer noStaffed;

        // Session-level indicators aggregation
        @Schema(description = "Bookable sessions count (session-level)", example = "5")
        private Integer bookableSessions;
        @Schema(description = "Full sessions count (session-level)", example = "1")
        private Integer fullSessions;
        @Schema(description = "Unstaffed sessions count (session-level)", example = "0")
        private Integer unstaffedSessions;

        @Schema(description = "Optional per-session items for this date")
        private List<CalendarItem> items;
    }

    @Data
    @Schema(description = "Calendar item for a specific session")
    public static class CalendarItem {
        private Long id;
        private String type; // session
        private String status; // available/booked/blocked
        private LocalTime start;
        private LocalTime end;
        private Long venueId;
        private String venueName;
    }
}


