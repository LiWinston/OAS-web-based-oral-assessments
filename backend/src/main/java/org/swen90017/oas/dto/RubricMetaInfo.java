package org.swen90017.oas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "Rubric meta information")
@Data
public class RubricMetaInfo {

    @Schema(description = "Rubric name", example = "Oral Presentation Rubric")
    String name;
    
    @Schema(description = "Rubric description", example = "Evaluation criteria for oral presentations")
    String description;
    
    @Schema(description = "Total points for the rubric", example = "100.0")
    Double totalPoints;
}
