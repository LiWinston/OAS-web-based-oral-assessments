package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "Detailed student result payload")
public class StudentResultDetailDTO implements Serializable {
    private AssignmentInfo assignment;
    private ReleaseInfo release;
    private SessionInfo session;
    private FinalScore finalScore;
    private Rubric rubric;
    private Feedback feedback;

    @Data
    @Schema(description = "Assignment context")
    public static class AssignmentInfo implements Serializable {
        private Long assignmentId;
        private String assignmentName;
        private String courseCode;
        private String courseName;
        private String semester;
        private String type;
        private String status;
        private Boolean resultsReleased;
        private String resultsReleasedAt;
    }

    @Data
    @Schema(description = "Release metadata")
    public static class ReleaseInfo implements Serializable {
        private Boolean released;
        private Integer notifiedStudents;
        private String releasedAt;
        private Long finalisedBy;
        private String finalisedByName;
        private String releaseMode;
    }

    @Data
    @Schema(description = "Session metadata")
    public static class SessionInfo implements Serializable {
        private Long sessionId;
        private String sessionLabel;
        private String startsAt;
        private String endsAt;
    }

    @Data
    @Schema(description = "Final score totals")
    public static class FinalScore implements Serializable {
        private String grade;
        private Double percentage;
        private Double totalPoints;
        private Double maxPoints;
    }

    @Data
    @Schema(description = "Rubric aggregation for the student")
    public static class Rubric implements Serializable {
        private List<RubricSection> sections;
        private RubricAggregate aggregate;
        private RubricDefinition definition;
    }

    @Data
    @Schema(description = "Rubric section summary")
    public static class RubricSection implements Serializable {
        private String sectionType;
        private String displayName;
        private Double weightShare;
        private Double totalPoints;
        private Double maxPoints;
        private List<RubricCriterion> criteria;
    }

    @Data
    @Schema(description = "Criterion level result")
    public static class RubricCriterion implements Serializable {
        private String criterionId;
        private String name;
        private String description;
        private Double weight;
        private Double maxPoints;
        private Double finalPoints;
        private Double percentage;
        private String finalLevelLabel;
        private String commentsCombined;
        private List<RubricCriterionComment> commentsByExaminer;
    }

    @Data
    @Schema(description = "Examiner comment for a criterion")
    public static class RubricCriterionComment implements Serializable {
        private Long examinerId;
        private String examinerName;
        private String comment;
    }

    @Data
    @Schema(description = "Aggregate rubric totals")
    public static class RubricAggregate implements Serializable {
        private Double totalPoints;
        private Double maxPoints;
        private Double percentage;
    }

    @Data
    @Schema(description = "Rubric definition mirroring assignment meta")
    public static class RubricDefinition implements Serializable {
        private RubricDefinitionMeta meta;
        private List<RubricMetaCriterion> individualRubrics;
        private List<RubricMetaCriterion> groupRubrics;
    }

    @Data
    @Schema(description = "Rubric meta block")
    public static class RubricDefinitionMeta implements Serializable {
        private String name;
        private String description;
        private Double totalPoints;
        private String weightBasis;
        private Double individualWeight;
        private Double groupWeight;
    }

    @Data
    @Schema(description = "Rubric meta criterion definition")
    public static class RubricMetaCriterion implements Serializable {
        private String description;
        private Double weight;
        private String scaleType;
        private List<PerformanceLevel> performanceLevel;
    }

    @Data
    @Schema(description = "Performance level definition")
    public static class PerformanceLevel implements Serializable {
        private String description;
        private Double startPoint;
        private Double endPoint;
        private List<String> preDefinedComment;
    }

    @Data
    @Schema(description = "Combined feedback payload")
    public static class Feedback implements Serializable {
        private String overallCommentsCombined;
        private List<OverallCommentByExaminer> overallCommentsByExaminer;
        private String strengthsCombined;
        private String improvementsCombined;
    }

    @Data
    @Schema(description = "Examiner overall feedback item")
    public static class OverallCommentByExaminer implements Serializable {
        private Long examinerId;
        private String examinerName;
        private String comment;
    }
}
