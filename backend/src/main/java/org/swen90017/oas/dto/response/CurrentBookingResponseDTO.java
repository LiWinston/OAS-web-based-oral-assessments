package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Current Booking Response DTO
 * Response for getting current booking information
 */
@Data
@Schema(description = "Current booking response")
public class CurrentBookingResponseDTO {

    /**
     * Whether student has an active booking
     */
    @Schema(description = "Whether student has an active booking", example = "true")
    private Boolean hasActiveBooking;

    /**
     * Booking information (if exists)
     */
    @Schema(description = "Booking information (if exists)")
    private BookingInfoDTO booking;

    /**
     * Booking Information DTO
     */
    @Data
    @Schema(description = "Booking information")
    public static class BookingInfoDTO {
        @Schema(description = "Booking ID", example = "70001")
        private Long bookingId;
        
        @Schema(description = "Entity information")
        private EntityInfoDTO entity;
        
        @Schema(description = "Session information")
        private SessionInfoDTO session;
        
        @Schema(description = "Whether rescheduling is enabled", example = "true")
        private Boolean reschedulingEnabled;
        
        @Schema(description = "Booking deadline", example = "2025-04-12T17:00:00+10:00")
        private String bookingDeadline;
        
        @Schema(description = "Whether lockout is enabled", example = "true")
        private Boolean lockoutEnabled;
        
        @Schema(description = "Lockout window in hours", example = "24")
        private Integer lockoutWindowHours;
    }

    /**
     * Entity Information DTO
     */
    @Data
    @Schema(description = "Entity information")
    public static class EntityInfoDTO {
        @Schema(description = "Entity type", example = "GROUP")
        private String type;
        
        @Schema(description = "Group ID", example = "501")
        private Long groupId;
    }

    /**
     * Session Information DTO
     */
    @Data
    @Schema(description = "Session information")
    public static class SessionInfoDTO {
        @Schema(description = "Session ID", example = "90011")
        private Long sessionId;
        
        @Schema(description = "Slot ID", example = "5001")
        private Long slotId;
        
        @Schema(description = "Start time", example = "2025-04-14T10:00:00+10:00")
        private String start;
        
        @Schema(description = "End time", example = "2025-04-14T10:30:00+10:00")
        private String end;
        
        @Schema(description = "Timezone", example = "Australia/Melbourne")
        private String timezone;
        
        @Schema(description = "Venue information")
        private VenueInfoDTO venue;
    }

    /**
     * Venue Information DTO
     */
    @Data
    @Schema(description = "Venue information")
    public static class VenueInfoDTO {
        @Schema(description = "Venue name", example = "Engineering")
        private String name;
        
        @Schema(description = "Building", example = "ENG")
        private String building;
        
        @Schema(description = "Room", example = "405")
        private String room;
    }
}
