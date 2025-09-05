package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Response for removing an assignment member with cascade summary.
 */
@Data
public class AssignmentMemberRemoveResponseDTO {

    @Schema(description = "Membership id (assignment_user_id)")
    private Long assignmentUserId;

    @Schema(description = "Role", example = "ROLE_STUDENT")
    private String role;

    @Schema(description = "Number of canceled bookings for students")
    private Integer canceledBookings;

    @Schema(description = "Number of cleared examiner slots")
    private Integer clearedExaminerSlots;
}


