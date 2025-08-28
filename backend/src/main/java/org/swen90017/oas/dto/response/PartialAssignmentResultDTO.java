package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PartialAssignmentResultDTO {
    @Schema(description = "Succeeded slot IDs")
    private List<Long> success = new ArrayList<>();

    @Schema(description = "Failed slot results")
    private List<SlotFailure> failures = new ArrayList<>();

    @Data
    public static class SlotFailure {
        private Long slotId;
        private String reason;
    }
}


