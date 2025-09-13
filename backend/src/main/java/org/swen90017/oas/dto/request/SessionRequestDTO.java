package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionRequestDTO {
    @NotNull
    @Schema(type = "string", format = "date", example = "2025-10-01")
    private LocalDate date;
    @NotNull
    @Schema(type = "string", format = "time", example = "09:00:00")
    private LocalTime startTime;
    @NotNull
    @Schema(type = "string", format = "time", example = "09:30:00")
    private LocalTime endTime;
    private Long venueId;
    private Integer requiredExaminers;
    private Integer capacity;
}


