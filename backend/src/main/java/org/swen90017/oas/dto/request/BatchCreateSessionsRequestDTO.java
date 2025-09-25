package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class BatchCreateSessionsRequestDTO {
    @NotEmpty
    private List<SessionWindowDTO> windows;

    @Data
    public static class SessionWindowDTO {
        @NotNull
        @Schema(type = "string", format = "date", example = "2025-10-01")
        private LocalDate date;
        @NotNull
        @Schema(type = "string", format = "time", example = "09:00:00")
        private LocalTime startTime;
        @NotNull
        @Schema(type = "string", format = "time", example = "10:00:00")
        private LocalTime endTime;
        private Integer sessionCount; // Optional; if null, compute max capacity based on config
        private Long venueId; // Nullable
        private Integer requiredExaminers; // Nullable
        private Integer capacity; // Nullable
    }
}


