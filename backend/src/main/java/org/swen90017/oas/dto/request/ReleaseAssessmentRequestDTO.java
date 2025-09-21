package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request DTO for releasing an assessment to students")
public class ReleaseAssessmentRequestDTO {
    
    @Schema(description = "Whether to notify students via email", example = "true")
    private Boolean notify = true;
}
