package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Response after adding a member to an assignment.
 */
@Data
public class AssignmentMemberCreateResponseDTO {

    @Schema(description = "Membership id (assignment_user_id)")
    private Long assignmentUserId;

    @Schema(description = "Global user id")
    private Long userId;

    @Schema(description = "Whether a new user was created")
    private Boolean created;

    @Schema(description = "Whether the membership link was created")
    private Boolean linked;

    @Schema(description = "Email")
    private String email;

    @Schema(description = "Role", example = "ROLE_STUDENT")
    private String role;

    @Schema(description = "Whether an invitation email was sent")
    private Boolean inviteSent;
}


