package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@Schema(description = "Single examiner session limit item")
public class ExaminerSessionLimitDTO {

    @Schema(description = "Examiner ID", example = "1")
    @NotNull(message = "examinerId is required")
    private Long examinerId;

    @Schema(description = "Max sessions allowed for this examiner (0 means unlimited)", example = "40")
    @NotNull(message = "maxSessions is required")
    @Min(value = 0, message = "maxSessions cannot be negative")
    private Integer maxSessions;
}


