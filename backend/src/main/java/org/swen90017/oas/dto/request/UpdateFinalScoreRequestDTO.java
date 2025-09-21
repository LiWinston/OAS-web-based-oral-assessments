package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;

@Data
@Schema(description = "Request DTO for updating final score")
public class UpdateFinalScoreRequestDTO {
    
    @NotNull(message = "Final score is required")
    @DecimalMin(value = "0.0", message = "Final score must be at least 0")
    @DecimalMax(value = "100.0", message = "Final score must not exceed 100")
    @Schema(description = "Final score percentage (0.0 to 100.0) with 1 decimal place", example = "85.0")
    private Double finalScorePct1dp;
    
    @Schema(description = "Optional reason for the manual override", example = "Moderation panel decision")
    private String reason;
}
