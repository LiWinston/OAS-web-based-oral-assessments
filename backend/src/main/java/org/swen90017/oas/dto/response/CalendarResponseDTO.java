package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

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

        @Schema(description = "Aggregated staffing status for the date: empty/partial/full", example = "partial")
        private String status;

        @Schema(description = "Total sessions on this date", example = "6")
        private Integer sessions;
    }
}


