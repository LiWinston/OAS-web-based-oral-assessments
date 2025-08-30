package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Create Booking Response DTO
 * Response for successful booking creation
 */
@Data
@Schema(description = "Create booking response")
public class CreateBookingResponseDTO {

    /**
     * Booking ID
     */
    @Schema(description = "Booking ID", example = "70001")
    private Long bookingId;

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    /**
     * Entity information
     */
    @Schema(description = "Entity information")
    private EntityInfoDTO entity;

    /**
     * Session information
     */
    @Schema(description = "Session information")
    private SessionInfoDTO session;

    /**
     * Notifications information
     */
    @Schema(description = "Notifications information")
    private NotificationsDTO notifications;

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
        @Schema(description = "Venue ID", example = "31")
        private Long venueId;
        
        @Schema(description = "Venue name", example = "Engineering")
        private String name;
        
        @Schema(description = "Building", example = "ENG")
        private String building;
        
        @Schema(description = "Room", example = "405")
        private String room;
    }

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
