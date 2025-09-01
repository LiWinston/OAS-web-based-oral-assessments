package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment Availability Response DTO
 * Used for returning assignment availability information with policies and quick stats
 */
@Schema(description = "Assignment availability response data")
@Data
public class AssignmentAvailabilityResponseDTO {

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    /**
     * Assessment type
     */
    @Schema(description = "Assessment type", example = "GROUP", allowableValues = {"INDIVIDUAL", "GROUP", "MIXED"})
    private String assessmentType;

    /**
     * Whether the assignment is released
     */
    @Schema(description = "Whether the assignment is released", example = "true")
    private Boolean released;

    /**
     * Visibility rule for the assignment
     */
    @Schema(description = "Visibility rule", example = "ONLY_FULLY_STAFFED", allowableValues = {"ONLY_FULLY_STAFFED", "ALL_AVAILABLE", "STAFFED_ONLY"})
    private String visibilityRule;

    /**
     * Whether rescheduling is enabled
     */
    @Schema(description = "Whether rescheduling is enabled", example = "true")
    private Boolean reschedulingEnabled;

    /**
     * Booking deadline
     */
    @Schema(description = "Booking deadline", example = "2025-04-12T17:00:00+10:00")
    private LocalDateTime bookingDeadline;

    /**
     * Whether lockout is enabled
     */
    @Schema(description = "Whether lockout is enabled", example = "true")
    private Boolean lockoutEnabled;

    /**
     * Lockout window in hours
     */
    @Schema(description = "Lockout window in hours", example = "24")
    private Integer lockoutWindowHours;

    /**
     * Availability summary with quick stats
     */
    @Schema(description = "Availability summary with quick stats")
    private AvailabilitySummaryDTO summary;

    /**
     * Polling hint in seconds
     */
    @Schema(description = "Polling hint in seconds", example = "30")
    private Integer pollingHintSeconds;

    /**
     * Availability Summary DTO
     */
    @Data
    @Schema(description = "Availability summary information")
    public static class AvailabilitySummaryDTO {

        /**
         * Total number of time slots
         */
        @Schema(description = "Total number of time slots", example = "12")
        private Integer totalSlots;

        /**
         * Total number of sessions
         */
        @Schema(description = "Total number of sessions", example = "36")
        private Integer totalSessions;

        /**
         * Number of available sessions
         */
        @Schema(description = "Number of available sessions", example = "5")
        private Integer availableSessions;

        /**
         * List of dates with availability
         */
        @Schema(description = "List of dates with availability", example = "[\"2025-04-14\", \"2025-04-16\"]")
        private List<String> daysWithAvailability;
    }
}
