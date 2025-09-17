package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.ZonedDateTime;

@Data
@Schema(description = "Assignment result summary response")
public class StudentResultSummaryDTO implements Serializable {
    private AssignmentInfo assignment;
    private ResultInfo result;
    private SummaryInfo summary;

    @Data
    public static class AssignmentInfo implements Serializable {
        private Long assignmentId;
        private String assignmentName;
        private String courseCode;
        private String courseName;
        private String assessmentType; // INDIVIDUAL|GROUP|MIXED
        private String semester;
    }

    @Data
    public static class ResultInfo implements Serializable {
        private Long resultId;
        private Entity entity;
        private String finalGrade;
        private Double percentage;
        private Double totalPoints;
        private Double maxPoints;
        private String resultStatus; // released|pending
        private ZonedDateTime assessedOn;
        private ZonedDateTime releasedOn;
        private String aggregationMethod; // average|max|min
        private Integer examinerCount;
    }

    @Data
    public static class Entity implements Serializable {
        private String type; // GROUP|INDIVIDUAL
        private Long groupId;
        private String groupName;
    }

    @Data
    public static class SummaryInfo implements Serializable {
        private Integer criteriaCount;
        private String highestCriterion;
        private String lowestCriterion;
        private Integer feedbackItemsCount;
    }
}


