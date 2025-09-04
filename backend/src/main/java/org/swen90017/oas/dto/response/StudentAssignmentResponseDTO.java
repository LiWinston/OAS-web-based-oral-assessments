package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Student Assignment Response DTO
 * Used for returning student assignment information with booking and availability details
 */
@Schema(description = "Student assignment response data")
@Data
public class StudentAssignmentResponseDTO {

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    /**
     * Assignment name
     */
    @Schema(description = "Assignment name", example = "Oral Exam 1")
    private String assignmentName;

    /**
     * Course code
     */
    @Schema(description = "Course code", example = "COMP90082")
    private String courseCode;

    /**
     * Assessment type
     */
    @Schema(description = "Assessment type", example = "GROUP", allowableValues = {"INDIVIDUAL", "GROUP", "MIXED"})
    private String assessmentType;

    /**
     * Session duration in minutes
     */
    @Schema(description = "Session duration in minutes", example = "30")
    private Integer sessionDurationMinutes;

    /**
     * Booking information
     */
    @Schema(description = "Booking information")
    private BookingInfoDTO booking;

    /**
     * Availability information
     */
    @Schema(description = "Availability information")
    private AvailabilityInfoDTO availability;

    /**
     * Booking Information DTO
     */
    @Data
    @Schema(description = "Booking information")
    public static class BookingInfoDTO {

        /**
         * Whether the student has an active booking
         */
        @Schema(description = "Whether the student has an active booking", example = "false")
        private Boolean hasActiveBooking;
    }

    /**
     * Availability Information DTO
     */
    @Data
    @Schema(description = "Availability information")
    public static class AvailabilityInfoDTO {

        /**
         * Whether the assignment is released
         */
        @Schema(description = "Whether the assignment is released", example = "true")
        private Boolean released;

        /**
         * Number of available sessions
         */
        @Schema(description = "Number of available sessions", example = "5")
        private Integer availableSessions;

        /**
         * Earliest session date/time
         */
        @Schema(description = "Earliest session date/time", example = "2025-04-14T09:00:00+10:00")
        private LocalDateTime earliestSession;

        /**
         * Latest session date/time
         */
        @Schema(description = "Latest session date/time", example = "2025-04-16T15:00:00+10:00")
        private LocalDateTime latestSession;

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
         * Polling hint in seconds
         */
        @Schema(description = "Polling hint in seconds", example = "30")
        private Integer pollingHintSeconds;
    }
}
