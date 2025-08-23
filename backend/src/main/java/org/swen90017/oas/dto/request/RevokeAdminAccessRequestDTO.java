package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "RevokeAdminAccessRequestDTO", description = "Request body for revoking admin access")
public class RevokeAdminAccessRequestDTO {
    @Schema(description = "Reason for revoking access", example = "No longer with institution")
    private String reason;              // Optional
    @Schema(description = "Target admin id to transfer courses to (optional)", example = "456")
    private String transferCoursesTo;   // Optional admin id to transfer courses to
}


