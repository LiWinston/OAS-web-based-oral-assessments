package org.swen90017.oas.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "Rubric meta information")
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)  // 只序列化非null字段，保持向后兼容
public class RubricMetaInfo {

    @Schema(description = "Rubric name", example = "Oral Presentation Rubric")
    String name;
    
    @Schema(description = "Rubric description", example = "Evaluation criteria for oral presentations")
    String description;
    
    @Schema(description = "Total points for the rubric", example = "100.0")
    Double totalPoints;
    
    @Schema(description = "Weight basis for interpreting criteria weights", example = "percentage", allowableValues = {"percentage", "points"})
    String weightBasis = "percentage";
    
    // Fields for MIX type assignments (optional, for backward compatibility)
    @Schema(description = "Individual score weight percentage for MIX type (0-100)", example = "40.0", nullable = true)
    Double individualWeight;
    
    @Schema(description = "Group score weight percentage for MIX type (0-100)", example = "60.0", nullable = true)
    Double groupWeight;
    
    @Schema(description = "Individual rubric criteria for MIX type", nullable = true)
    List<RubricsInfoDto> individualRubrics;
    
    @Schema(description = "Group rubric criteria for MIX type", nullable = true)
    List<RubricsInfoDto> groupRubrics;
}
