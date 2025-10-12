package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Examiner scoring information for a student or group")
public class ExaminerScoringDTO {
    
    @Schema(description = "Assignment information")
    private AssignmentInfo assignment;
    
    @Schema(description = "Subject information (student or group)")
    private SubjectInfo subject;
    
    @Schema(description = "All examiner markings for this subject")
    private List<ExaminerMarkDetailDTO> examiners;
    
    @Schema(description = "Computed scores summary")
    private ScoreSummary scores;
    
    @Data
    @Schema(description = "Assignment information")
    public static class AssignmentInfo {
        @Schema(description = "Assignment ID", example = "123")
        private Long id;
        
        @Schema(description = "Assignment name", example = "Final Presentation")
        private String name;
    }
    
    @Data
    @Schema(description = "Subject information (student or group)")
    public static class SubjectInfo {
        @Schema(description = "Subject ID", example = "456")
        private Long id;
        
        @Schema(description = "Subject name", example = "John Smith")
        private String name;
        
        @Schema(description = "Subject type", example = "INDIVIDUAL", allowableValues = {"INDIVIDUAL", "GROUP"})
        private String type;
        
        @Schema(description = "Group member count (only for groups)", example = "4")
        private Integer memberCount;
    }
    
    @Data
    @Schema(description = "Score summary information")
    public static class ScoreSummary {
        @Schema(description = "Average score from all submitted examiners", example = "85.5")
        private Double averageScorePct1dp;
        
        @Schema(description = "Final effective score (with overrides)", example = "87.0")
        private Double effectiveFinalScorePct1dp;
        
        @Schema(description = "Number of submitted examiner assessments", example = "2")
        private Integer submittedCount;
        
        @Schema(description = "Total number of assigned examiners", example = "3")
        private Integer totalCount;
        
        @Schema(description = "Manual override information")
        private ManualOverride manualOverride;
        
        @Data
        @Schema(description = "Manual score override information")
        public static class ManualOverride {
            @Schema(description = "Override score percentage", example = "87.0")
            private Double valuePct1dp;
            
            @Schema(description = "Override reason", example = "Adjusted for technical difficulties")
            private String reason;
            
            @Schema(description = "Override timestamp", example = "2025-04-15T14:30:00+10:00")
            private String overrideAt;
            
            @Schema(description = "Override by user ID", example = "101")
            private Long overrideByUserId;
        }
    }
}
