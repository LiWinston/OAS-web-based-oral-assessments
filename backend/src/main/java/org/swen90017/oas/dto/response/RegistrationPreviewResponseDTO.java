package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Date;

@Data
@Schema(name = "RegistrationPreviewResponseDTO", description = "Basic info returned before activating an invited account")
public class RegistrationPreviewResponseDTO {
    @Schema(description = "User role", example = "STUDENT", allowableValues = {"STUDENT","ADMIN"})
    private String role;

    @Schema(description = "User ID", example = "123")
    private Long userId;

    @Schema(description = "Email used for activation", example = "jsmith@gmail.com")
    private String email;

    @Schema(description = "Display name", example = "John Smith")
    private String name;

    @Schema(description = "Account status", example = "INVITED")
    private String status;

    @Schema(description = "Invitation time")
    private Date invitedAt;

    @Schema(description = "Registration time if already completed")
    private Date registeredAt;

    @Schema(description = "Last login time")
    private Date lastLoginAt;

    // Admin-only
    @Schema(description = "Department (ADMIN only)")
    private String department;

    // Student-only
    @Schema(description = "SIS user id (STUDENT only)")
    private String sisUserId;

    @Schema(description = "Student number (STUDENT only)")
    private String studentNumber;
}


