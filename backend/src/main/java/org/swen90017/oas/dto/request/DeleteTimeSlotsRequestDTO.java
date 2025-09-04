package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@Schema(description = "Delete time slots request DTO")
public class DeleteTimeSlotsRequestDTO {

    @Schema(description = "List of time slot IDs to delete", example = "[1, 2, 3]")
    @NotEmpty(message = "Time slot IDs list cannot be empty")
    @Size(min = 1, max = 50, message = "Time slot IDs count must be between 1 and 50")
    private List<Long> timeSlotIds;
}
