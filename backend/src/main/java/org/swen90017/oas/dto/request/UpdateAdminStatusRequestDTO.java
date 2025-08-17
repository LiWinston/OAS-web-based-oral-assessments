package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "UpdateAdminStatusRequestDTO", description = "Request body for updating admin status")
public class UpdateAdminStatusRequestDTO {
    @Schema(description = "Target status", allowableValues = {"ACTIVE","INACTIVE","INVITED","EXPIRED"}, example = "INACTIVE")
    private String status; // ACTIVE, INACTIVE, INVITED, EXPIRED
    @Schema(description = "Optional reason for status change", example = "Temporary leave of absence")
    private String reason; // Optional explanation
}


