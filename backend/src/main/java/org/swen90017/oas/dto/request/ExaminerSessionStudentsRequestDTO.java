package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * Examiner Session Students Request DTO
 * Used for requesting session students and groups information by session ID
 */
@Schema(description = "Request for getting session students and groups")
@Data
public class ExaminerSessionStudentsRequestDTO {

    /**
     * Session ID
     */
    @Schema(description = "Session ID", example = "1001", required = true)
    @NotNull(message = "Session ID cannot be null")
    private Long sessionId;

    /**
     * Examiner ID (optional - if not provided, will use current logged-in examiner from JWT token)
     */
    @Schema(description = "Examiner ID (optional)", example = "2001", required = false)
    private Long examinerId;
}
