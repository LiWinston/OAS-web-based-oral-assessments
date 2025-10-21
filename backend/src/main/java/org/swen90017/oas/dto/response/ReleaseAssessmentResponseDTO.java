package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Response DTO for releasing an assessment to students")
public class ReleaseAssessmentResponseDTO {
    
    @Schema(description = "Whether the assessment was successfully released", example = "true")
    private Boolean released;
    
    @Schema(description = "Number of students notified", example = "1")
    private Integer notifiedStudents;

    @Schema(description = "Release mode applied to the assessment", example = "FULL", allowableValues = {"FULL", "SCORES_ONLY"})
    private String releaseMode;
}
