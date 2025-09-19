package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
@Schema(description = "Self unassign session request")
public class ExaminerSelfUnassignRequestDTO {
    @NotNull
    @Schema(description = "Examiner ID")
    private Long examinerId;

    @NotNull
    @Schema(description = "Session ID")
    private Long sessionId;
}


