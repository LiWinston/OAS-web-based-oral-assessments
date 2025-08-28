package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.swen90017.oas.enums.SessionStatus;

import java.time.LocalTime;

@Data
@Schema(description = "Session detail DTO")
public class SessionDetailDTO {

    @Schema(description = "Session ID", example = "101")
    private Long id;

    @Schema(description = "Start time", example = "09:00")
    private LocalTime startTime;

    @Schema(description = "End time", example = "09:30")
    private LocalTime endTime;

    @Schema(description = "Session status", example = "available")
    private SessionStatus status;

    @Schema(description = "Booked by (student/group info)", example = "null")
    private String bookedBy;

    @Schema(description = "Session number", example = "1")
    private Integer sessionNumber;
}
