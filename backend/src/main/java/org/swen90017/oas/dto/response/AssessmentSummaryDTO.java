package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Assessment summary for list view")
public class AssessmentSummaryDTO {
    
    @Schema(description = "Assessment information")
    private AssessmentInfo assessment;
    
    @Schema(description = "Session information")
    private AssessmentSessionDTO session;
    
    @Schema(description = "Computed scores")
    private AssessmentComputedDTO computed;
    
    @Schema(description = "Release status", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
    private String releaseStatus;
    
    @Data
    @Schema(description = "Assessment information")
    public static class AssessmentInfo {
        @Schema(description = "Assessment key")
        private AssessmentKeyDTO key;
        
        @Schema(description = "Student information (for individual assessments)")
        private StudentInfo student;
        
        @Schema(description = "Group information (for group assessments)")
        private GroupInfo group;
        
        @Data
        @Schema(description = "Student information")
        public static class StudentInfo {
            @Schema(description = "Student ID", example = "200045")
            private Long id;
            
            @Schema(description = "Student name", example = "Alice Tan")
            private String name;
        }
        
        @Data
        @Schema(description = "Group information")
        public static class GroupInfo {
            @Schema(description = "Group ID", example = "300012")
            private Long id;
            
            @Schema(description = "Group name", example = "Team Alpha")
            private String name;
            
            @Schema(description = "Number of group members", example = "4")
            private Integer memberCount;
        }
    }
}
