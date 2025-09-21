package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Rubric meta information for admin results")
public class AdminRubricMetaInfoDTO {
    
    @Schema(description = "Rubric ID", example = "501")
    private Long rubricId;
    
    @Schema(description = "Rubric name", example = "Oral Exam 1 Rubric")
    private String name;
    
    @Schema(description = "Rubric scale type", example = "points", allowableValues = {"points", "weight"})
    private String scale;
    
    @Schema(description = "Maximum points (when scale is points)", example = "100.0")
    private Double maxPoints;
}
