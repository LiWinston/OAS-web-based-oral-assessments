package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * Reschedule Booking Request DTO
 * Used for rescheduling existing bookings
 */
@Data
@Schema(description = "Reschedule booking request")
public class RescheduleBookingRequestDTO {

    /**
     * Student ID
     */
    @NotNull(message = "Student ID is required")
    @Schema(description = "Student ID", example = "201")
    private Long studentId;

    /**
     * Target session ID to reschedule to
     */
    @NotNull(message = "Target session ID is required")
    @Schema(description = "Target session ID to reschedule to", example = "90021")
    private Long targetSessionId;
}
