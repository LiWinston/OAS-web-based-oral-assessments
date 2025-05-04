package org.swen90017.oas.common;

/**
 * Security-related error codes and messages
 * @author: Yun Chen
 */
public enum SecurityError implements Error {
    /** Invalid credentials */
    INVALID_CREDENTIALS("3001", "Invalid username or password"),
    
    /** Account locked */
    ACCOUNT_LOCKED("3002", "Account is locked due to multiple failed login attempts"),
    
    /** Account disabled */
    ACCOUNT_DISABLED("3003", "Account has been disabled"),
    
    /** Account expired */
    ACCOUNT_EXPIRED("3004", "Account has expired"),
    
    /** Insufficient privileges */
    INSUFFICIENT_PRIVILEGES("3005", "User has insufficient privileges for this operation"),
    
    /** Invalid token */
    INVALID_TOKEN("3006", "Invalid or expired authentication token"),
    
    /** Missing token */
    MISSING_TOKEN("3007", "Authentication token is missing");
    private final String code;
    private final String message;
    
    SecurityError(String code, String message) {
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