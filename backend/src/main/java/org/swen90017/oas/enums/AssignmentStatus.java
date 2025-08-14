package org.swen90017.oas.enums;

/**
 * Assignment Status Enum
 * Defines the status of assignments in the system
 */
public enum AssignmentStatus {
    
    PENDING("PENDING", "Pending"),
    IN_PROGRESS("IN_PROGRESS", "In Progress"),
    COMPLETED("COMPLETED", "Completed"),
    CANCELLED("CANCELLED", "Cancelled");

    private final String code;
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
