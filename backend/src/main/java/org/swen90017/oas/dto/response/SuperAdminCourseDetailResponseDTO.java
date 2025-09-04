package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "Super Admin course detail response")
public class SuperAdminCourseDetailResponseDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String semester;
    private Integer year;
    private String department;
    private Long venueId;
    private String status;
    private Long adminId;
    private String adminName;
    private String adminEmail;
    private Integer studentsCount;
    private Integer assignmentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<SuperAdminAssignmentBriefDTO> assignments;
}


