package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Assignment member item in list response.
 */
@Data
public class AssignmentMemberResponseDTO {

    @Schema(description = "Membership id (assignment_user_id)")
    private Long assignmentUserId;

    @Schema(description = "Global user id")
    private Long userId;

    @Schema(description = "Role in this assignment", example = "ROLE_STUDENT")
    private String role;

    @Schema(description = "Email")
    private String email;

    @Schema(description = "Full name")
    private String fullName;

    @Schema(description = "Group id for student (optional)")
    private Long groupId;

    @Schema(description = "Bookings count for student (optional)")
    private Integer bookingsCount;

    @Schema(description = "Assigned slots count for examiner (optional)")
    private Integer assignedSlotsCount;

    @Schema(description = "Added time")
    private LocalDateTime addedAt;
}


