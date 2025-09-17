package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "Rubric scale (levels per criterion)")
public class StudentRubricScaleDTO implements Serializable {
    private List<CriterionScale> criteria;

    @Data
    public static class CriterionScale implements Serializable {
        private Long criterionId;
        private List<Level> levels;
    }

    @Data
    public static class Level implements Serializable {
        private String label;
        private Double points;
    }
}


