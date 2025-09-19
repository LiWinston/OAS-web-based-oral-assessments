package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Update sessions examiners result")
public class UpdateSessionsResultDTO {
    @Schema(description = "Updated session IDs")
    private List<Long> updatedSessionIds;
}


