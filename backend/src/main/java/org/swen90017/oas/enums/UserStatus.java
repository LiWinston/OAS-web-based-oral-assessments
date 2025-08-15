package org.swen90017.oas.enums;

/**
 * Unified user status across roles (student/admin)
 *
 * Codes are stored in DB as strings for `sys_user.status`.
 */
public enum UserStatus {
    /** User has completed registration and can sign in */
    ACTIVE("0"),
    /** User is deactivated/disabled (not deleted) */
    INACTIVE("1");

    private final String code;

    UserStatus(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static UserStatus fromCode(String code) {
        for (UserStatus s : values()) {
            if (s.code.equals(code)) return s;
        }
        return null;
    }
}


