package org.swen90017.oas.common;

/**
 * Business-specific error codes and messages
 * @author: Yun Chen
 */
public enum BusinessError implements Error {
    /** Booking validation failed */
    BOOKING_VALIDATION_FAILED("2001", "Booking validation failed"),
    CSV_READ_FAILED("2002", "CSV read failed"),
    CSV_WRITE_FAILED("2003", "CSV write failed"),
    USER_NOT_FOUND("2004", "User not found"),;
    
    private final String code;
    private final String message;
    
    BusinessError(String code, String message) {
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