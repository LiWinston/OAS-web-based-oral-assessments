package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Detailed examiner marking information")
public class ExaminerMarkDetailDTO {
    
    @Schema(description = "Examiner ID", example = "44")
    private Long examinerId;
    
    @Schema(description = "Examiner name", example = "Dr. Smith")
    private String name;
    
    @Schema(description = "Assessment status", example = "SUBMITTED", allowableValues = {"DRAFT", "SUBMITTED", "REOPENED"})
    private String assessmentStatus;
    
    @Schema(description = "When the assessment was submitted", example = "2025-04-14T10:41:00+10:00")
    private String submittedAt;
    
    @Schema(description = "Examiner's total score percentage (1 decimal place)", example = "83.0")
    private Double examinerScorePct1dp;
    
    @Schema(description = "Rubric items with scores")
    private List<RubricItem> items;
    
    @Schema(description = "Overall feedback for the student/group")
    private String overallFeedback;
    
    @Schema(description = "Admin-visible notes")
    private String notes;
    
    @Data
    @Schema(description = "Rubric item with examiner's score")
    public static class RubricItem {
        @Schema(description = "Criterion ID", example = "C1")
        private String criterionId;
        
        @Schema(description = "Performance level ID", example = "L3")
        private String levelId;
        
        @Schema(description = "Points awarded", example = "18.0")
        private Double points;
        
        @Schema(description = "Comments for this criterion")
        private List<Comment> comments;
        
        @Data
        @Schema(description = "Comment information")
        public static class Comment {
            @Schema(description = "Comment source", example = "predefined", allowableValues = {"predefined", "custom"})
            private String source;
            
            @Schema(description = "Comment text", example = "Strong structure")
            private String text;
            
            @Schema(description = "Predefined comment ID (if source is predefined)", example = "comment_123")
            private String predefinedId;
        }
    }
}
