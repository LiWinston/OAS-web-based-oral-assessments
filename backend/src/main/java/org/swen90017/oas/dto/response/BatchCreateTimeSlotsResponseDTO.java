package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Batch create time slots response DTO")
public class BatchCreateTimeSlotsResponseDTO {

    @Schema(description = "Number of time slots created", example = "2")
    private Integer timeSlotsCreated;

    @Schema(description = "Total number of sessions generated", example = "7")
    private Integer sessionsGenerated;

    @Schema(description = "Created time slots with details")
    private List<TimeSlotDetailDTO> timeSlots;

    @Schema(description = "Success message", example = "2 time slots created with 7 sessions generated")
    private String message;
}
