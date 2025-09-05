package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

/**
 * Request payload for manually adding a member (student or examiner) to an assignment.
 * Supports ROLE_STUDENT and ROLE_EXAMINER.
 */
@Data
public class AddAssignmentMemberRequestDTO {

    /**
     * Role of the member to add. Example: ROLE_STUDENT or ROLE_EXAMINER
     */
    @Schema(description = "Role of the member to add", example = "ROLE_STUDENT")
    @NotBlank
    private String role;

    /**
     * Email address of the user to add. If user does not exist, a new user will be created and invited.
     */
    @Schema(description = "Email of the user to add", example = "user@example.edu")
    @NotBlank
    @Email
    private String email;

    /**
     * Optional full name for the user when creating a new account.
     */
    @Schema(description = "Optional full name for the new user", example = "Jane Doe")
    private String fullName;

    /**
     * Optional student identifier when adding a student.
     */
    @Schema(description = "Student identifier (for ROLE_STUDENT)", example = "1234567")
    private String studentId;

    /**
     * Optional staff identifier when adding an examiner.
     */
    @Schema(description = "Staff identifier (for ROLE_EXAMINER)", example = "t-42")
    private String staffId;

    /**
     * Optional group id if assignment uses groups and the student should be placed in a group.
     */
    @Schema(description = "Group identifier (optional)", example = "1001")
    private Long groupId;
}


