package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Response DTO for reviewing an examiner's marking")
public class ReviewExaminerResponseDTO {
    
    @Schema(description = "Whether the examiner was successfully reopened", example = "true")
    private Boolean reopened;
    
    @Schema(description = "New release status after review", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
    private String releaseStatus;
    
    @Schema(description = "Whether the examiner was notified via email", example = "true")
    private Boolean notified;
}
