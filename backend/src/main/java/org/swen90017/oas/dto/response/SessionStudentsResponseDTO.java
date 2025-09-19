package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Session Students Response DTO
 * Used for returning session students and groups information
 */
@Schema(description = "Session students and groups response data")
@Data
public class SessionStudentsResponseDTO {

    /**
     * Session ID
     */
    @Schema(description = "Session ID", example = "1001")
    private Long sessionId;

    /**
     * Total count of enrolled students and groups
     */
    @Schema(description = "Total count of enrolled students and groups", example = "5")
    private Integer totalCount;

    /**
     * List of enrolled students
     */
    @Schema(description = "List of enrolled students")
    private List<StudentInfoDTO> students;

    /**
     * List of enrolled groups
     */
    @Schema(description = "List of enrolled groups")
    private List<GroupInfoDTO> groups;

    /**
     * Student Information DTO
     */
    @Data
    @Schema(description = "Student information")
    public static class StudentInfoDTO {
        /**
         * Student user ID
         */
        @Schema(description = "Student user ID", example = "2001")
        private Long userId;

        /**
         * Student number
         */
        @Schema(description = "Student number", example = "1234567")
        private String studentNumber;

        /**
         * Student name
         */
        @Schema(description = "Student name", example = "John Doe")
        private String studentName;

        /**
         * Student email
         */
        @Schema(description = "Student email", example = "john.doe@student.unimelb.edu.au")
        private String email;

        /**
         * Booking time
         */
        @Schema(description = "Booking time", example = "2024-01-15T10:30:00")
        private LocalDateTime bookedTime;

        /**
         * Booking type
         */
        @Schema(description = "Booking type", example = "INDIVIDUAL")
        private String type;
    }

    /**
     * Group Information DTO
     */
    @Data
    @Schema(description = "Group information")
    public static class GroupInfoDTO {
        /**
         * Group ID
         */
        @Schema(description = "Group ID", example = "501")
        private Long groupId;

        /**
         * Group name
         */
        @Schema(description = "Group name", example = "Team Alpha")
        private String groupName;

        /**
         * Canvas group ID
         */
        @Schema(description = "Canvas group ID", example = "canvas_group_123")
        private String canvasGroupId;

        /**
         * List of group members
         */
        @Schema(description = "List of group members")
        private List<GroupMemberDTO> members;

        /**
         * Booking time
         */
        @Schema(description = "Booking time", example = "2024-01-15T10:30:00")
        private LocalDateTime bookedTime;

        /**
         * Booking type
         */
        @Schema(description = "Booking type", example = "GROUP")
        private String type;
    }

    /**
     * Group Member DTO
     */
    @Data
    @Schema(description = "Group member information")
    public static class GroupMemberDTO {
        /**
         * Member user ID
         */
        @Schema(description = "Member user ID", example = "2002")
        private Long userId;

        /**
         * Member student number
         */
        @Schema(description = "Member student number", example = "1234568")
        private String studentNumber;

        /**
         * Member name
         */
        @Schema(description = "Member name", example = "Jane Smith")
        private String studentName;

        /**
         * Member email
         */
        @Schema(description = "Member email", example = "jane.smith@student.unimelb.edu.au")
        private String email;
    }
}
