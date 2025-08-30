package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
@Schema(description = "Request to update session limits for multiple examiners")
public class UpdateExaminerSessionLimitsRequestDTO {

    @Schema(description = "List of examiner limits")
    @Valid
    @NotEmpty(message = "examinerLimits must not be empty")
    private List<ExaminerSessionLimitDTO> examinerLimits;
}


