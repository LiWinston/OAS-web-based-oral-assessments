package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Computed scores for an assessment")
public class AssessmentComputedDTO {
    
    @Schema(description = "Average score percentage (1 decimal place) from SUBMITTED examiners, null if none submitted", example = "83.0")
    private Double averageScorePct1dp;
    
    @Schema(description = "Effective final score percentage (1 decimal place) - equals manual override or average", example = "83.0")
    private Double effectiveFinalScorePct1dp;
    
    @Schema(description = "Manual override information")
    private ManualOverrideInfo manualOverride;
    
    @Data
    @Schema(description = "Manual override information")
    public static class ManualOverrideInfo {
        @Schema(description = "Override score percentage (1 decimal place)", example = "85.0")
        private Double valuePct1dp;
        
        @Schema(description = "Reason for override", example = "Moderation panel decision")
        private String reason;
        
        @Schema(description = "User who set the override")
        private UserInfo by;
        
        @Schema(description = "When the override was set", example = "2025-04-14T15:30:00+10:00")
        private String at;
        
        @Data
        @Schema(description = "User information")
        public static class UserInfo {
            @Schema(description = "User ID", example = "123")
            private Long id;
            
            @Schema(description = "User name", example = "Dr. Admin")
            private String name;
        }
    }
}
