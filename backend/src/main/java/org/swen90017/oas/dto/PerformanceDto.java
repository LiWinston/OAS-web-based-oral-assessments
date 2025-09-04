package org.swen90017.oas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Set;

@Schema(description = "Performance level definition for rubric criteria")
@Data
public class PerformanceDto {
    @Schema(description = "Performance level description", example = "Excellent")
    String description;
    
    @Schema(description = "Starting point for this performance level", example = "85.0")
    Double startPoint;
    
    @Schema(description = "Ending point for this performance level", example = "100.0")
    Double endPoint;

    @Schema(description = "Pre-defined comments for this criterion")
    Set<String> preDefinedComment;
}
