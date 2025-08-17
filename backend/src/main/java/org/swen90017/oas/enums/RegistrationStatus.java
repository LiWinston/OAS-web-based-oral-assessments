package org.swen90017.oas.enums;

/**
 * Registration workflow status (stored in sys_user.registration_status)
 */
public enum RegistrationStatus {
    INVITED("0"),
    REGISTERED("1"),
    EXPIRED("2");

    private final String code;

    RegistrationStatus(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static RegistrationStatus fromCode(String code) {
        for (RegistrationStatus s : values()) {
            if (s.code.equals(code)) return s;
        }
        return null;
    }
}


