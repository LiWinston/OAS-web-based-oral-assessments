package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Release schedule request DTO")
public class ReleaseScheduleRequestDTO {

    @Schema(description = "Whether to notify students", example = "true")
    private Boolean notifyStudents = true;

    @Schema(description = "Whether to notify examiners", example = "true")
    private Boolean notifyExaminers = true;

    @Schema(description = "Release message", example = "Assessment schedule is now available for booking.")
    private String releaseMessage;
}
