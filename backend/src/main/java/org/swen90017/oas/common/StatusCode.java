package org.swen90017.oas.common;

/**
 * Common status codes
 * @author: Yun Chen
 */
public enum StatusCode {

    /** Success */
    SUCCESS("0", "Success"),
    
    /** Failure */
    FAILURE("1", "Operation failed");
    
    private final String code;
    private final String message;
    
    StatusCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getMessage() {
        return message;
    }
} 