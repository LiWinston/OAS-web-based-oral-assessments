package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionRequestDTO {
    @NotNull
    private LocalDate date;
    @NotNull
    private LocalTime startTime;
    @NotNull
    private LocalTime endTime;
    private Long venueId;
    private Integer requiredExaminers;
    private Integer capacity;
}


