package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * Create Booking Request DTO
 * Used for creating new bookings using existing slot_sessions table
 */
@Data
@Schema(description = "Create booking request")
public class CreateBookingRequestDTO {

    /**
     * Student ID
     */
    @NotNull(message = "Student ID is required")
    @Schema(description = "Student ID", example = "201")
    private Long studentId;

    /**
     * Session ID to book
     */
    @NotNull(message = "Session ID is required")
    @Schema(description = "Session ID to book", example = "90011")
    private Long sessionId;

    /**
     * Group ID (required for GROUP or MIXED assignments)
     */
    @Schema(description = "Group ID (required for GROUP or MIXED assignments)", example = "501")
    private Long groupId;
}
