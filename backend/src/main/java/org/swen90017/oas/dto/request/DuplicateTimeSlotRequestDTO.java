package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Schema(description = "Duplicate time slot request DTO")
public class DuplicateTimeSlotRequestDTO {

    @Schema(description = "New date for the duplicated time slot", example = "2025-04-16")
    private LocalDate date;

    @Schema(description = "New start time for the duplicated time slot", example = "14:00")
    private LocalTime startTime;

    @Schema(description = "Whether to clear existing examiners from the duplicated slot", example = "true")
    private Boolean clearExaminers = false;
}
