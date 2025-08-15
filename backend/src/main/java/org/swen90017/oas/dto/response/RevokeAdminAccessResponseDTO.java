package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "RevokeAdminAccessResponseDTO", description = "Response payload after revoking admin access")
public class RevokeAdminAccessResponseDTO {
    @Schema(description = "Revocation time in ISO8601 UTC", example = "2025-01-02T10:30:00Z")
    private String revokedAt;          // ISO8601 UTC time
    @Schema(description = "Number of courses transferred to the target admin (placeholder)", example = "0")
    private Integer coursesTransferred; // placeholder count
}


