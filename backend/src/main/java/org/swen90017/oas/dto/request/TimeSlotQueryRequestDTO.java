package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "TimeSlot list query filters")
public class TimeSlotQueryRequestDTO {

    @Schema(description = "Filter by status", example = "partial")
    private String status;

    @Schema(description = "Filter by start date (YYYY-MM-DD)", example = "2025-04-14")
    private String dateFrom;

    @Schema(description = "Filter by end date (YYYY-MM-DD)", example = "2025-04-18")
    private String dateTo;
}


