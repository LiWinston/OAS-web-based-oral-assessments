package org.swen90017.oas.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AdminSessionsListResponseDTO {
    private List<Item> sessions;
    private Summary summary;
    
    // New fields for assignment time range validation
    private Boolean outsideAssignmentRange;
    private String message;

    @Data
    public static class Item {
        private Long id;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private Long venueId;
        private String venueName;
        private Integer requiredExaminers;
        private Integer capacity;
        private List<ExaminerDTO> assignedExaminers;
        private List<EnrolledStudentDTO> enrolledStudents;
        private List<EnrolledGroupDTO> enrolledGroups;
        private Integer bookedCount;
        private Integer remainingCapacity;
        private String status;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime lastModified;
        private Boolean publishedToExaminer;
        private Boolean publishedToStudent;
    }

    @Data
    public static class ExaminerDTO {
        private Long id;
        private String name;
    }

    @Data
    public static class EnrolledStudentDTO {
        private Long id;
        private String name;
        private String studentNumber;
    }

    @Data
    public static class EnrolledGroupDTO {
        private Long id;
        private String name;
        private Integer memberCount;
    }

    @Data
    public static class Summary {
        // Session counts
        private Integer totalSessions;           // Total number of sessions
        
        // Examiner staffing statistics
        private Integer fullyStaffed;            // Sessions with all required examiners assigned
        private Integer partiallyStaffed;        // Sessions with some but not all examiners
        private Integer unstaffed;               // Sessions with no examiners assigned
        private Integer totalRequiredExaminers;  // Total examiners needed across all sessions
        private Integer totalAssignedExaminers;  // Total examiners currently assigned
        
        // Student booking statistics
        private Integer totalCapacity;           // Total student/group capacity across all sessions
        private Integer totalBooked;             // Total students/groups booked across all sessions
    }
}


