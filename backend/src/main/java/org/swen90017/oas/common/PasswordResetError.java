package org.swen90017.oas.common;

public enum PasswordResetError implements Error {
    INVALID_CODE("4001", "The code is invalid or expired."),
    TOO_MANY_ATTEMPTS("4002", "Too many attempts. Please request a new code."),
    RATE_LIMITED("4003", "Request throttled; please try again later."),
    WEAK_PASSWORD("4004", "Password does not meet complexity requirements."),
    NOT_ALLOWED("4005", "Role not permitted to reset password."),
    SAME_AS_OLD_PASSWORD("4006", "New password must differ from the current password.");

    private final String code;
    private final String message;

    PasswordResetError(String code, String message) {
        this.code = code;
        this.message = message;
    }

    @Override
    public String getCode() {
        return code;
    }

    @Override
    public String getMessage() {
        return message;
    }
}


