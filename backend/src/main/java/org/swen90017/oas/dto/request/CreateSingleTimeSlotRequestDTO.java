package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Schema(description = "Create single time slot request")
public class CreateSingleTimeSlotRequestDTO {

    @Schema(description = "Date of the time slot", example = "2025-04-15")
    @NotNull
    private LocalDate date;

    @Schema(description = "Start time", example = "09:00")
    @NotNull
    private LocalTime startTime;

    @Schema(description = "Number of sessions in this time slot", example = "3")
    @NotNull
    @Min(1)
    private Integer sessionCount;

    @Schema(description = "Venue ID", example = "31")
    @NotNull
    private Long venueId;

    @Schema(description = "Required number of examiners (optional)", example = "2")
    private Integer requiredExaminers;

    @Schema(description = "Examiner IDs to assign (optional)")
    private List<Long> assignExaminerIds;
}


