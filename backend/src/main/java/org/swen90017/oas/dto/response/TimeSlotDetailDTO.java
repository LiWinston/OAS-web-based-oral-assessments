package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.swen90017.oas.enums.SlotStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Schema(description = "Time slot detail DTO")
public class TimeSlotDetailDTO {

    @Schema(description = "Time slot ID", example = "1")
    private Long id;

    @Schema(description = "Date", example = "2025-04-15")
    private LocalDate date;

    @Schema(description = "Start time", example = "09:00")
    private LocalTime startTime;

    @Schema(description = "End time", example = "10:30")
    private LocalTime endTime;

    @Schema(description = "Venue", example = "Engineering Building, Room 405")
    private Long venueId;

    @Schema(description = "Venue name", example = "Engineering")
    private String venueName;

    @Schema(description = "Required number of examiners", example = "2")
    private Integer requiredExaminers;

    @Schema(description = "Number of sessions", example = "3")
    private Integer sessionCount;

    @Schema(description = "Time slot status", example = "empty")
    private SlotStatus status;

    @Schema(description = "Currently assigned examiners")
    private List<ExaminerDetailDTO> assignedExaminers;

    @Schema(description = "Individual sessions within this time slot")
    private List<SessionDetailDTO> sessions;

    @Schema(description = "Number of booked sessions", example = "0")
    private Integer bookedSessions;

    @Schema(description = "Creation time", example = "2025-08-26T09:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "Last modification time", example = "2025-08-26T10:30:00")
    private LocalDateTime lastModified;
}
