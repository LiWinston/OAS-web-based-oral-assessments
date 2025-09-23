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
    
    @Schema(description = "Final grade information")
    private FinalGradeInfo finalGrade;
    
    @Data
    @Schema(description = "Final grade and feedback information")
    public static class FinalGradeInfo {
        @Schema(description = "Final grade percentage (1 decimal place)", example = "85.5")
        private Double gradePct1dp;
        
        @Schema(description = "Final grade letter (if applicable)", example = "HD")
        private String gradeLetter;
        
        @Schema(description = "Consolidated feedback from all examiners")
        private String consolidatedFeedback;
        
        @Schema(description = "Administrative notes (admin only)")
        private String adminNotes;
        
        @Schema(description = "Whether this is a manual override")
        private Boolean isManualOverride;
        
        @Schema(description = "Override reason (if manual override)")
        private String overrideReason;
    }
}
