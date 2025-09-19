package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Self unassign result")
public class SelfUnassignResultDTO {
    @Schema(description = "Session ID")
    private Long sessionId;

    @Schema(description = "Operation success")
    private Boolean success;
}


