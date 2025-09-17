package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "Detailed rubric breakdown for a result")
public class StudentRubricBreakdownDTO implements Serializable {
    private Long resultId;
    private RubricBreakdown rubricBreakdown;

    @Data
    public static class RubricBreakdown implements Serializable {
        private String aggregationMethod; // average|max|min
        private List<Criterion> criteria;
    }

    @Data
    public static class Criterion implements Serializable {
        private Long criterionId;
        private String name;
        private String description;
        private Double weight;
        private Double maxPoints;
        private Double earnedPoints;
        private List<ExaminerScore> examinerScores;
        private List<String> comments;
    }

    @Data
    public static class ExaminerScore implements Serializable {
        private Long examinerId;
        private String examinerName;
        private Double points;
        private String level;
    }
}


