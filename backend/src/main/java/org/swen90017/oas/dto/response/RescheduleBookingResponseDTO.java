package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Reschedule Booking Response DTO
 * Response for successful booking rescheduling
 */
@Data
@Schema(description = "Reschedule booking response")
public class RescheduleBookingResponseDTO {

    /**
     * Booking ID
     */
    @Schema(description = "Booking ID", example = "70001")
    private Long bookingId;

    /**
     * Original session ID
     */
    @Schema(description = "Original session ID", example = "90011")
    private Long fromSessionId;

    /**
     * New session ID
     */
    @Schema(description = "New session ID", example = "90021")
    private Long toSessionId;

    /**
     * Notifications information
     */
    @Schema(description = "Notifications information")
    private NotificationsDTO notifications;

    /**
     * Notifications DTO
     */
    @Data
    @Schema(description = "Notifications information")
    public static class NotificationsDTO {
        @Schema(description = "Whether email was queued", example = "true")
        private Boolean emailQueued;
        
        @Schema(description = "ICS calendar URL", example = "/api/calendar/booking/70001.ics")
        private String icsUrl;
    }
}
