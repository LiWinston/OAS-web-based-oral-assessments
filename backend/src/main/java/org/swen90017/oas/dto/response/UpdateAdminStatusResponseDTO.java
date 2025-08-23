package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "UpdateAdminStatusResponseDTO", description = "Response payload after updating admin status")
public class UpdateAdminStatusResponseDTO {
    @Schema(description = "Admin user id", example = "123")
    private String id;
    @Schema(description = "Updated status", example = "INACTIVE")
    private String status;
    @Schema(description = "Update time in ISO8601", example = "2025-01-02T10:30:00Z")
    private String updatedAt; // ISO8601 timestamp string
}


