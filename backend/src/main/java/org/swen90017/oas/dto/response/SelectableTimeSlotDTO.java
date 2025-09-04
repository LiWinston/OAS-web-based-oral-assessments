package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.swen90017.oas.enums.SlotStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SelectableTimeSlotDTO {
    private Long slotId;
    private Long assignmentId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long venueId;
    private Integer sessionCount;
    private Integer requiredExaminers;
    private Integer currentExaminers;
    private SlotStatus status;

    @Schema(description = "Whether the slot has reached examiner capacity")
    private Boolean full;

    @Schema(description = "Whether this slot conflicts with examiner's existing assignments")
    private Boolean conflict;

    @Schema(description = "Whether the examiner is already assigned to this slot")
    private Boolean assigned;
}


