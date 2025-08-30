package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Bookable Sessions Response DTO
 * Response for listing bookable sessions grouped by slot/day
 */
@Data
@Schema(description = "Bookable sessions response")
public class BookableSessionsResponseDTO {

    /**
     * Assignment information
     */
    @Schema(description = "Assignment information")
    private AssignmentInfoDTO assignment;

    /**
     * Calendar information
     */
    @Schema(description = "Calendar information")
    private CalendarInfoDTO calendar;

    /**
     * Time slots with sessions
     */
    @Schema(description = "Time slots with sessions")
    private List<TimeSlotWithSessionsDTO> timeSlots;

    /**
     * Assignment Information DTO
     */
    @Data
    @Schema(description = "Assignment information")
    public static class AssignmentInfoDTO {
        @Schema(description = "Assignment ID", example = "101")
        private Long assignmentId;
        
        @Schema(description = "Assignment name", example = "Oral Exam 1")
        private String assignmentName;
        
        @Schema(description = "Assessment type", example = "GROUP")
        private String assessmentType;
    }

    /**
     * Calendar Information DTO
     */
    @Data
    @Schema(description = "Calendar information")
    public static class CalendarInfoDTO {
        @Schema(description = "Date", example = "2025-04-14")
        private String date;
    }

    /**
     * Time Slot with Sessions DTO
     */
    @Data
    @Schema(description = "Time slot with sessions")
    public static class TimeSlotWithSessionsDTO {
        @Schema(description = "Slot ID", example = "5001")
        private Long slotId;
        
        @Schema(description = "Start time", example = "2025-04-14T10:00:00+10:00")
        private String start;
        
        @Schema(description = "End time", example = "2025-04-14T11:30:00+10:00")
        private String end;
        
        @Schema(description = "Timezone", example = "Australia/Melbourne")
        private String timezone;
        
        @Schema(description = "Venue information")
        private VenueInfoDTO venue;
        
        @Schema(description = "Required examiners", example = "2")
        private Integer requiredExaminers;
        
        @Schema(description = "Current examiners", example = "2")
        private Integer currentExaminers;
        
        @Schema(description = "Whether slot is fully staffed", example = "true")
        private Boolean isFullyStaffed;
        
        @Schema(description = "Sessions in this slot")
        private List<SessionAvailabilityDTO> sessions;
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
     * Session Availability DTO
     */
    @Data
    @Schema(description = "Session availability information")
    public static class SessionAvailabilityDTO {
        @Schema(description = "Session ID", example = "90011")
        private Long sessionId;
        
        @Schema(description = "Start time", example = "2025-04-14T10:00:00+10:00")
        private String start;
        
        @Schema(description = "End time", example = "2025-04-14T10:30:00+10:00")
        private String end;
        
        @Schema(description = "Status", example = "available")
        private String status;
        
        @Schema(description = "Availability details")
        private AvailabilityDetailsDTO availability;
    }

    /**
     * Availability Details DTO
     */
    @Data
    @Schema(description = "Availability details")
    public static class AvailabilityDetailsDTO {
        @Schema(description = "Whether session can be booked", example = "true")
        private Boolean canBook;
        
        @Schema(description = "Reason if session cannot be booked", example = "SESSION_TAKEN")
        private String reason;
    }
}
