package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Response for time slots selection API")
public class TimeSlotsSelectionResponseDTO {

    @Schema(description = "Assignment basic information")
    private AssignmentBasicInfoDTO assignment;

    @Schema(description = "Examiner capacity information")
    private ExaminerCapacityInfoDTO examinerInfo;

    @Schema(description = "Available time slots")
    private List<TimeSlotSelectionDTO> timeSlots;

    @Data
    @Schema(description = "Assignment basic information")
    public static class AssignmentBasicInfoDTO {
        @Schema(description = "Assignment ID", example = "101")
        private Long assignmentId;

        @Schema(description = "Assignment name", example = "Mid-Semester Oral Assessment")
        private String assignmentName;

        @Schema(description = "Course code", example = "COMP90082")
        private String courseCode;

        @Schema(description = "Course name", example = "Software Project")
        private String courseName;

        @Schema(description = "Assessment type", example = "GROUP")
        private String assessmentType;
    }

    @Data
    @Schema(description = "Examiner capacity information")
    public static class ExaminerCapacityInfoDTO {
        @Schema(description = "Maximum sessions examiner can take", example = "10")
        private Integer maxSessions;

        @Schema(description = "Currently assigned sessions", example = "3")
        private Integer currentAssignedSessions;

        @Schema(description = "Remaining capacity", example = "7")
        private Integer remainingCapacity;
    }

    @Data
    @Schema(description = "Time slot selection information")
    public static class TimeSlotSelectionDTO {
        @Schema(description = "Time slot ID", example = "5001")
        private Long slotId;

        @Schema(description = "Start time", example = "2025-04-14T10:00:00+10:00")
        private String start;

        @Schema(description = "End time", example = "2025-04-14T11:00:00+10:00")
        private String end;

        @Schema(description = "Timezone", example = "Australia/Melbourne")
        private String timezone;

        @Schema(description = "Venue information")
        private VenueInfoDTO venue;

        @Schema(description = "Number of sessions in this slot", example = "2")
        private Integer sessionCount;

        @Schema(description = "Required number of examiners", example = "2")
        private Integer requiredExaminers;

        @Schema(description = "Current number of assigned examiners", example = "1")
        private Integer currentExaminers;

        @Schema(description = "Whether the slot is full", example = "false")
        private Boolean isFull;

        @Schema(description = "Availability information")
        private AvailabilityInfoDTO availability;
    }

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

    @Data
    @Schema(description = "Availability information")
    public static class AvailabilityInfoDTO {
        @Schema(description = "Whether examiner can select this slot", example = "true")
        private Boolean canSelect;

        @Schema(description = "Reason why cannot select", example = "SLOT_FULL")
        private String reason;
    }
}
