package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class ExaminerScheduleDTO {
    @Schema(description = "Examiner ID")
    private Long examinerId;

    @Schema(description = "Assignment ID (optional)")
    private Long assignmentId;

    @Schema(description = "Assigned slots")
    private List<AssignedSlotDTO> slots;

    @Data
    public static class AssignedSlotDTO {
        private Long slotId;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private Long venueId;
        private Integer sessionCount;
    }
}


