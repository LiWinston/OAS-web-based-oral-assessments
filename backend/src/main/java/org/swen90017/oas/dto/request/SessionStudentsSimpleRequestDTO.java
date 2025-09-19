package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * Simple Session Students Request DTO
 * Used for requesting basic session students and groups information by session ID only
 */
@Schema(description = "Request for getting basic session students and groups information")
@Data
public class SessionStudentsSimpleRequestDTO {

    /**
     * Session ID
     */
    @Schema(description = "Session ID", example = "1001", required = true)
    @NotNull(message = "Session ID cannot be null")
    private Long sessionId;
}
