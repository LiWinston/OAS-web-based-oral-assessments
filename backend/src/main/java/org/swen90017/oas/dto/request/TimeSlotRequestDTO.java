package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Schema(description = "Time slot request DTO")
public class TimeSlotRequestDTO {

    @Schema(description = "Date of the time slot", example = "2025-04-15")
    @NotNull(message = "Date cannot be null")
    private LocalDate date;

    @Schema(description = "Start time", example = "09:00")
    @NotNull(message = "Start time cannot be null")
    private LocalTime startTime;

    @Schema(description = "End time", example = "10:30")
    @NotNull(message = "End time cannot be null")
    private LocalTime endTime;

    @Schema(description = "Number of sessions in this time slot", example = "3")
    @NotNull(message = "Session count cannot be null")
    @Min(value = 1, message = "Session count must be at least 1")
    private Integer sessionCount;

    @Schema(description = "Venue ID", example = "31")
    @NotNull(message = "VenueId cannot be null")
    private Long venueId;
}
