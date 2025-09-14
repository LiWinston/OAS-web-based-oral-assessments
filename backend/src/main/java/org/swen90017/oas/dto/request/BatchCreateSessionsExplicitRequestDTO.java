package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class BatchCreateSessionsExplicitRequestDTO {
    @NotEmpty
    private List<Item> sessions;

    @Data
    public static class Item {
        @NotNull
        private LocalDate date;
        @NotNull
        private LocalTime startTime;
        @NotNull
        private LocalTime endTime;
        private Long venueId;
        private Integer requiredExaminers;
        private Integer capacity;
    }
}


