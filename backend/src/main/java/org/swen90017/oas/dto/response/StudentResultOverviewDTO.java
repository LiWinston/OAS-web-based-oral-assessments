package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "Student results overview response")
public class StudentResultOverviewDTO implements Serializable {
    private Integer pageNum;
    private Integer pageSize;
    private Long total;
    private List<Item> data;

    @Data
    @Schema(description = "Released assignment result item")
    public static class Item implements Serializable {
        private Long assignmentId;
        private String assignmentName;
        private String courseCode;
        private String courseName;
        private String semester;
        private String assignmentType;
        private String status;
        private Boolean resultsReleased;
        private Boolean hasMixedRubric;
        private String releasedAt;
        private String assessedOn;
        private FinalScore finalScore;
    }

    @Data
    @Schema(description = "Final score summary for overview item")
    public static class FinalScore implements Serializable {
        private String grade;
        private Double percentage;
        private Double totalPoints;
        private Double maxPoints;
    }
}


