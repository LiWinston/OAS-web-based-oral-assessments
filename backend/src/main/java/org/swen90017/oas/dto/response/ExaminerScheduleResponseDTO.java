package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Examiner schedule grouped by assignments")
public class ExaminerScheduleResponseDTO {

    @Schema(description = "Assignments list")
    private List<AssignmentScheduleDTO> assignments;

    @Data
    public static class AssignmentScheduleDTO {
        private Long assignmentId;
        private String assignmentName;
        private String courseCode;
        private String courseName;
        private List<SessionScheduleDTO> sessions;
    }

    @Data
    public static class SessionScheduleDTO {
        private Long sessionId;
        private String start; // ISO string with timezone
        private String end;   // ISO string with timezone
        private VenueInfo venue;
        private Integer requiredExaminers;
        private Integer currentExaminers;
        private Boolean isBooked;
        private Integer bookingCount;
        private Boolean canWithdraw;
        private String cannotWithdrawReason;
    }

    @Data
    public static class VenueInfo {
        private Long Id;
        private String venueName;
        private Long assignmentId;

    }
}


