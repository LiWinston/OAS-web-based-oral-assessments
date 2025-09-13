package org.swen90017.oas.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AdminSessionsListResponseDTO {
    private List<Item> sessions;
    private Summary summary;

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
        private Integer bookedCount;
        private Integer remainingCapacity;
        private String status;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime lastModified;
    }

    @Data
    public static class ExaminerDTO {
        private Long id;
        private String name;
    }

    @Data
    public static class Summary {
        private Integer totalSessions;
        private Integer fullyStaffed;
        private Integer partiallyStaffed;
        private Integer unstaffed;
    }
}


