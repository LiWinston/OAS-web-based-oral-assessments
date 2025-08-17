package org.swen90017.oas.dto.request;

import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Schema(name = "AdminInviteDTO", description = "Request body for inviting a new course administrator")
public class AdminInviteDTO {
    @Schema(description = "Admin email", example = "newadmin@student.unimelb.edu.au")
    private String email;
    @Schema(description = "Admin display name", example = "Dr. Jane Smith")
    private String name;
    @Schema(description = "Department name", example = "Computer Science")
    private String department;
    @Schema(description = "Optional invitation message", example = "Welcome to OAS! You've been invited to manage oral assessments.")
    private String message;
    @Schema(description = "External ID from CSV (optional)", example = "A12345")
    private String id;
    @Schema(description = "SIS user id (optional)", example = "jsmith")
    private String sisUserId;
    @Schema(description = "SIS login id (used for email if provided)", example = "jsmith")
    private String sisLoginId;
}


