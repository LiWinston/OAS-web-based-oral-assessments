package org.swen90017.oas.enums;

/**
 * Assignment Type Enum
 * Defines the types of assignments in the system
 */
public enum AssignmentType {
    
    INDIVIDUAL("individual", "Individual"),
    GROUP("group", "Group"),
    MIXED("mixed", "Mixed");

    private final String code;
    private final String description;

    AssignmentType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static AssignmentType fromCode(String code) {
        for (AssignmentType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return INDIVIDUAL;
    }
}
