package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.List;

@Data
@Schema(description = "Student results overview response")
public class StudentResultOverviewDTO implements Serializable {
    private Integer pageNum;
    private Integer pageSize;
    private Long total;
    private List<Item> data;
    private Integer cachingHintSeconds;

    @Data
    public static class Item implements Serializable {
        private Long assignmentId;
        private String assignmentName;
        private String courseCode;
        private String courseName;
        private String semester;
        private String assessmentType;
        private ResultSummary result;
        private Boolean hasDetailedFeedback;
    }

    @Data
    public static class ResultSummary implements Serializable {
        private Long resultId;
        private String finalGrade;
        private Double percentage;
        private Double totalPoints;
        private Double maxPoints;
        private String resultStatus; // released|pending
        private ZonedDateTime assessedOn;
        private ZonedDateTime releasedOn;
    }
}


