package org.swen90017.oas.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class GenerateSessionsRequestDTO {
    @NotNull
    private LocalDate date;
    @NotNull
    @Schema(type = "string", format = "time", example = "09:30:00")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    @DateTimeFormat(pattern = "HH:mm:ss")
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


