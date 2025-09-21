package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Rubric criterion for admin results")
public class AdminRubricCriterionDTO {
    
    @Schema(description = "Criterion ID", example = "C1")
    private String criterionId;
    
    @Schema(description = "Criterion title", example = "Communication")
    private String title;
    
    @Schema(description = "Weight percentage or points depending on scale", example = "30.0")
    private Double weightOrPoints;
    
    @Schema(description = "Performance levels for this criterion")
    private List<PerformanceLevel> performanceLevels;
    
    @Schema(description = "Sub-criteria (optional)")
    private List<AdminRubricCriterionDTO> subCriteria;
    
    @Data
    @Schema(description = "Performance level definition")
    public static class PerformanceLevel {
        @Schema(description = "Level ID", example = "L4")
        private String levelId;
        
        @Schema(description = "Level label", example = "Excellent")
        private String label;
        
        @Schema(description = "Level value/points", example = "30.0")
        private Double value;
        
        @Schema(description = "Level description", example = "Clear and persuasive")
        private String description;
    }
}
