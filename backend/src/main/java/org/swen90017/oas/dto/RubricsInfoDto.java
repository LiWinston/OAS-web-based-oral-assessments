package org.swen90017.oas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Schema(description = "Rubric criteria information")
@Data
public class RubricsInfoDto {

    @Schema(description = "Criterion description", example = "Communication Skills")
    String description;
    
    @Schema(description = "Weight of this criterion", example = "25.0")
    Double weight;
    
    @Schema(description = "Scale type", example = "points")
    String scaleType;
    
    @Schema(description = "List of performance levels")
    List<PerformanceDto> performanceLevel;

}
