package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class GenerateSessionsRequestDTO {
    @NotNull
    private LocalDate date;
    @NotNull
    private LocalTime startTime;
    @Min(1)
    private Integer count;
    @Min(1)
    private Integer length;   // minutes
    @Min(0)
    private Integer gapTime;  // minutes

    private Long venueId;
    @Min(0)
    private Integer requiredExaminers;
    @Min(0)
    private Integer capacity;
}


