package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@Schema(description = "Batch create time slots request DTO")
public class BatchCreateTimeSlotsRequestDTO {

    @Schema(description = "List of time slots to create")
    @NotEmpty(message = "Time slots list cannot be empty")
    @Size(min = 1, max = 50, message = "Time slots count must be between 1 and 50")
    @Valid
    private List<TimeSlotRequestDTO> timeSlots;
}
