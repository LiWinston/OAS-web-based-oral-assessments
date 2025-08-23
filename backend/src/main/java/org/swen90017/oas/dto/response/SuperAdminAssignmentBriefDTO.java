package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Schema(description = "Assignment brief info for Super Admin course detail")
public class SuperAdminAssignmentBriefDTO {
    private Long id;
    private String name;
    private String type;
    private String status;
    private Integer studentsAssessed;
    private LocalDateTime completedAt;
}


