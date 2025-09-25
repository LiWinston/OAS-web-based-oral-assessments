package org.swen90017.oas.enums;

/**
 * Release Status Enum
 * Defines the release state of assessment results to students
 */
public enum ReleaseStatus {
    /**
     * Assessment results are not released to students
     */
    NOT_RELEASED("NOT_RELEASED", "Results not released to students"),
    
    /**
     * Assessment results are released to students
     */
    RELEASED("RELEASED", "Results released to students");

    private final String code;
    private final String description;

    ReleaseStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static ReleaseStatus fromCode(String code) {
        for (ReleaseStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return NOT_RELEASED; // Default to NOT_RELEASED
    }
}
