package org.swen90017.oas.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Complete participant detail with assignment, session, rubric, and examiner information")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminParticipantDetailDTO {
    
    @Schema(description = "Assignment information")
    private AssignmentInfo assignment;
    
    @Schema(description = "Session information")
    private SessionInfo session;
    
    @Schema(description = "Participant information")
    private ParticipantInfo participant;
    
    @Schema(description = "Rubric snapshot")
    private RubricSnapshot rubricSnapshot;
    
    @Schema(description = "Examiner submissions")
    private List<ExaminerSubmission> examiners;
    
    @Data
    @Schema(description = "Assignment information")
    public static class AssignmentInfo {
        @Schema(description = "Assignment ID", example = "184")
        private Long id;
        
        @Schema(description = "Assignment name", example = "Oral Presentation")
        private String name;
        
        @Schema(description = "Assignment type", example = "MIXED", allowableValues = {"INDIVIDUAL", "GROUP", "MIXED"})
        private String type;
    }
    
    @Data
    @Schema(description = "Session information")
    public static class SessionInfo {
        @Schema(description = "Session ID", example = "804")
        private Long id;
        
        @Schema(description = "Session start time (ISO 8601 with timezone)", example = "2025-10-22T09:35:00+11:00")
        private String start;
        
        @Schema(description = "Session end time (ISO 8601 with timezone)", example = "2025-10-22T10:05:00+11:00")
        private String end;
        
        @Schema(description = "Timezone", example = "Australia/Melbourne")
        private String timezone;
        
        @Schema(description = "Venue information")
        private VenueInfo venue;
        
        @Data
        @Schema(description = "Venue information")
        public static class VenueInfo {
            @Schema(description = "Venue ID", example = "2352")
            private Long venueId;
            
            @Schema(description = "Venue name", example = "Alan Gilbert Building (Par 210)")
            private String name;
        }
    }
    
    @Data
    @Schema(description = "Participant information")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ParticipantInfo {
        @Schema(description = "Participant type", example = "GROUP", allowableValues = {"GROUP", "INDIVIDUAL"})
        private String type;
        
        // Group fields
        @Schema(description = "Group ID (only for GROUP type)", example = "30")
        private Long groupId;
        
        @Schema(description = "Group name (only for GROUP type)", example = "W07G6")
        private String groupName;
        
        @Schema(description = "Number of members (only for GROUP type)", example = "2")
        private Integer memberCount;
        
        @Schema(description = "Group members (only for GROUP type)")
        private List<MemberInfo> members;
        
        // Individual fields
        @Schema(description = "Student ID (only for INDIVIDUAL type)", example = "3")
        private Long studentId;
        
        @Schema(description = "Student name (only for INDIVIDUAL type)", example = "Bob")
        private String name;
        
        @Schema(description = "Student number (only for INDIVIDUAL type)", example = "123456")
        private String studentNumber;
        
        // Common fields
        @Schema(description = "Release status", example = "RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
        private String releaseStatus;
        
        @Data
        @Schema(description = "Group member information")
        public static class MemberInfo {
            @Schema(description = "Student ID", example = "3")
            private Long studentId;
            
            @Schema(description = "Student name", example = "Bob")
            private String name;
            
            @Schema(description = "Final score for this member (average of all examiner scores)", example = "86.5")
            private Double finalScore;
        }
    }
    
    @Data
    @Schema(description = "Rubric snapshot")
    public static class RubricSnapshot {
        @Schema(description = "Rubric name", example = "Final presentation (Mixed) Rubric")
        private String name;
        
        @Schema(description = "Rubric description", example = "Final presentation (Mixed) Rubric desc")
        private String description;
        
        @Schema(description = "Total points", example = "100.0")
        private Double totalPoints;
        
        @Schema(description = "Weight basis", example = "percentage", allowableValues = {"percentage", "points"})
        private String weightBasis;
        
        @Schema(description = "Group weight (for MIXED type)", example = "50.0")
        private Double groupWeight;
        
        @Schema(description = "Individual weight (for MIXED type)", example = "50.0")
        private Double individualWeight;
        
        @Schema(description = "Group rubric criteria")
        private List<RubricCriterion> groupRubrics;
        
        @Schema(description = "Individual rubric criteria")
        private List<RubricCriterion> individualRubrics;
        
        @Data
        @Schema(description = "Rubric criterion")
        public static class RubricCriterion {
            @Schema(description = "Criterion description", example = "Group Criterion 1")
            private String description;
            
            @Schema(description = "Weight", example = "25.0")
            private Double weight;
            
            @Schema(description = "Scale type", example = "points", allowableValues = {"points", "percentage"})
            private String scaleType;
            
            @Schema(description = "Performance levels")
            private List<PerformanceLevel> performanceLevels;
            
            @Data
            @Schema(description = "Performance level")
            public static class PerformanceLevel {
                @Schema(description = "Level label", example = "Outstanding")
                private String label;
                
                @Schema(description = "Minimum points", example = "90.0")
                private Double minPoints;
                
                @Schema(description = "Maximum points", example = "100.0")
                private Double maxPoints;
                
                @Schema(description = "Predefined comments")
                private List<String> predefinedComments;
            }
        }
    }
    
    @Data
    @Schema(description = "Examiner submission")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ExaminerSubmission {
        @Schema(description = "Submission ID", example = "123")
        private Long submissionId;
        
        @Schema(description = "Examiner ID", example = "88")
        private Long examinerId;
        
        @Schema(description = "Examiner name", example = "Dr. Smith")
        private String examinerName;
        
        @Schema(description = "Assessment status", example = "SUBMITTED", allowableValues = {"DRAFT", "SUBMITTED", "REOPENED"})
        private String assessmentStatus;
        
        @Schema(description = "Submitted at (ISO 8601 with timezone)", example = "2025-10-22T11:00:00+11:00")
        private String submittedAt;
        
        @Schema(description = "Reopened at (ISO 8601 with timezone)", example = "2025-10-24T09:00:00+11:00")
        private String reopenedAt;
        
        @Schema(description = "Overall feedback", example = "Excellent presentation with clear structure.")
        private String overallFeedback;
        
        @Schema(description = "Total score given by this examiner", example = "88.0")
        private Double totalScore;
        
        @Schema(description = "Rubric scores")
        private RubricScores rubricScores;
        
        @Data
        @Schema(description = "Rubric scores")
        public static class RubricScores {
            @Schema(description = "Group rubric scores")
            private List<GroupScore> group;
            
            @Schema(description = "Individual rubric scores")
            private List<IndividualScore> individual;
            
            @Data
            @Schema(description = "Group rubric score")
            public static class GroupScore {
                @Schema(description = "Criterion description", example = "Group Criterion 1")
                private String criterionDescription;
                
                @Schema(description = "Selected level", example = "Outstanding")
                private String selectedLevel;
                
                @Schema(description = "Points awarded", example = "22.0")
                private Double pointsAwarded;
                
                @Schema(description = "Comments")
                private List<String> comments;
            }
            
            @Data
            @Schema(description = "Individual rubric score")
            public static class IndividualScore {
                @Schema(description = "Student ID", example = "3")
                private Long studentId;
                
                @Schema(description = "Student name", example = "Bob")
                private String studentName;
                
                @Schema(description = "Criterion description", example = "Individual Criterion 1")
                private String criterionDescription;
                
                @Schema(description = "Selected level", example = "Very Good")
                private String selectedLevel;
                
                @Schema(description = "Points awarded", example = "21.5")
                private Double pointsAwarded;
                
                @Schema(description = "Comments")
                private List<String> comments;
            }
        }
    }
}

