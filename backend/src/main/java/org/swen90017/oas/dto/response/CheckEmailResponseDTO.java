package org.swen90017.oas.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(name = "CheckEmailResponseDTO", description = "Response payload for checking if an email exists and is valid")
public class CheckEmailResponseDTO {
    @Schema(description = "Email that is checked", example = "test@student.unimelb.edu.au")
    private String email;
    @Schema(description = "Whether the email already exists")
    private boolean exists;
    @JsonProperty("isValid")
    @Schema(description = "Whether the email format is valid")
    private boolean valid;
}


