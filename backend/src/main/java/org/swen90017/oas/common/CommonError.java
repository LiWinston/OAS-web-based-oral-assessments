package org.swen90017.oas.common;

/**
 * Common error codes and messages
 * @author: Yun Chen
 */
public enum CommonError implements Error {
    
    /** Authentication error */
    UNAUTHORIZED("401", "Unauthorized access"),
    
    /** Resource not found */
    NOT_FOUND("404", "Resource not found"),
    
    /** Server error */
    SERVER_ERROR("500", "Internal server error"),
    BAD_REQUEST("400", "Bad request"),
    
    /** Invalid parameters */
    INVALID_PARAMS("1001", "Invalid parameters"),
    
    /** Authentication failed */
    AUTHENTICATION_FAILED("1002", "Authentication failed"),
    
    /** Operation denied */
    FORBIDDEN("1003", "Operation not permitted"),
    
    /** Account disabled */
    ACCOUNT_DISABLED("1004", "Account is disabled"),

    CONVERSION_ERROR("1005", "Conversion error"),
    
    /** Resource already exists */
    ALREADY_EXISTS("1005", "Resource already exists");
    private final String code;
    private final String message;
    
    CommonError(String code, String message) {
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