package org.swen90017.oas.enums;

/**
 * Assessment Status Enum
 * Defines the different states of assessment for students/groups in a session
 */
public enum AssessmentStatus {
    /**
     * Student/Group is in session but no assessment record exists
     */
    NO_MARK("NO_MARK", "No assessment record"),
    
    /**
     * Assessment exists but is in draft state
     */
    DRAFT("DRAFT", "Draft assessment"),
    
    /**
     * Assessment has been submitted and finalized
     */
    SUBMITTED("SUBMITTED", "Submitted assessment"),
    
    /**
     * Assessment was returned/rejected and needs to be reopened for re-assessment
     */
    REOPEN("REOPEN", "Needs re-assessment");

    private final String code;
    private final String description;

    AssessmentStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static AssessmentStatus fromCode(String code) {
        for (AssessmentStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return null;
    }
}
