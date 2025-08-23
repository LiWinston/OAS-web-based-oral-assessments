package org.swen90017.oas.enums;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Assignment Type Enum
 * Defines the types of assignments in the system
 */
@Schema(description = "Assignment type enumeration")
public enum AssignmentType {
    
    @Schema(description = "Individual assignment") INDIVIDUAL("individual", "Individual"),
    @Schema(description = "Group assignment") GROUP("group", "Group"),
    @Schema(description = "Mixed assignment (both individual and group components)") MIXED("mixed", "Mixed");

    @Schema(description = "Type code")
    private final String code;
    
    @Schema(description = "Type description")
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
