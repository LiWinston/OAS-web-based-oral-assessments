package org.swen90017.oas.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Assignment Status Enum
 * Defines the status of assignments in the system
 */
@Schema(description = "Assignment status enumeration")
public enum AssignmentStatus {
    
    @Schema(description = "Assignment is pending") PENDING("PENDING", "Pending"),
    @Schema(description = "Assignment is in progress") IN_PROGRESS("IN_PROGRESS", "In Progress"),
    @Schema(description = "Assignment is completed") COMPLETED("COMPLETED", "Completed"),
    @Schema(description = "Assignment is cancelled") CANCELLED("CANCELLED", "Cancelled");

    @Schema(description = "Status code")
    private final String code;
    
    @Schema(description = "Status description")
    private final String description;

    AssignmentStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static AssignmentStatus fromCode(String code) {
        for (AssignmentStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return PENDING;
    }
}
