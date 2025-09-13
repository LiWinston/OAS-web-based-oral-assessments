package org.swen90017.oas.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Set;

@Schema(description = "Performance level definition for rubric criteria")
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PerformanceDto {
    @Schema(description = "Performance level description", example = "Excellent")
    @JsonAlias({"level"})
    String description;
    
    @Schema(description = "Starting point for this performance level", example = "85.0")
    @JsonAlias({"points"})
    Double startPoint;
    
    @Schema(description = "Ending point for this performance level", example = "100.0")
    @JsonAlias({"points"})
    Double endPoint;

    @Schema(description = "Pre-defined comments for this criterion")
    Set<String> preDefinedComment;
}
