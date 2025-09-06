package org.swen90017.oas.dto.request;

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
        private LocalDate date;
        @NotNull
        private LocalTime startTime;
        @NotNull
        private LocalTime endTime;
        private Integer sessionCount; // 可选；若为空，根据配置自动计算最大可容纳
        private Long venueId; // 可空
    }
}


