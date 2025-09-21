package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
@Schema(description = "Request DTO for reviewing an examiner's marking")
public class ReviewExaminerRequestDTO {
    
    @NotBlank(message = "Reason is required")
    @Schema(description = "Reason for reviewing the examiner's marking", example = "Please expand justification for criterion C2.")
    private String reason;
}
