package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Response for updating a time slot, including deleted sessions info")
public class UpdateTimeSlotResponseDTO {

    @Schema(description = "Updated time slot details")
    private TimeSlotDetailDTO timeSlot;

    @Schema(description = "Sessions removed due to being out of new time range")
    private List<SessionDetailDTO> deletedSessions;

    @Schema(description = "Number of deleted sessions", example = "2")
    private Integer deletedCount;
}


