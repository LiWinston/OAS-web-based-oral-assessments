package org.swen90017.oas.common;

public enum LogError implements Error {
    /** Log operation exception */
    LOG_EXCEPTION("3001", "Log operation exception"),

    /** Log record not found */
    LOG_NOT_FOUND("3002", "Log record not found"),

    /** Log record already exists */
    LOG_ALREADY_EXISTS("3003", "Log record already exists"),
    LOG_PARSE_ERROR("3004", "Log record parse error"),
    LOG_RECORD_ERROR("3005", "Log record error"),

    /** Log record invalid */
    LOG_INVALID("3006", "Log record invalid");

    private final String code;
    private final String message;

    LogError(String code, String message) {
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
