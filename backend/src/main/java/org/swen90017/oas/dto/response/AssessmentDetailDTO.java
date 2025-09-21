package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Detailed assessment information for admin results")
public class AssessmentDetailDTO {
    
    @Schema(description = "Assessment information")
    private AssessmentSummaryDTO.AssessmentInfo assessment;
    
    @Schema(description = "Session information")
    private AssessmentSessionDTO session;
    
    @Schema(description = "Rubric information")
    private AdminRubricDTO rubric;
    
    @Schema(description = "Examiner markings")
    private List<ExaminerMarkDetailDTO> examiners;
    
    @Schema(description = "Computed scores")
    private AssessmentComputedDTO computed;
    
    @Schema(description = "Release status", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
    private String releaseStatus;
}
