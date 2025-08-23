package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Super Admin course list item")
public class SuperAdminCourseItemDTO {
    private Long id;
    private String code;
    private String name;
    private String semester;
    private Integer year;
    private String department;
    private String venue;
    private String status;
    private Long adminId;
    private String adminName;
    private String adminEmail;
    private Integer studentsCount;
    private Integer assignmentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


