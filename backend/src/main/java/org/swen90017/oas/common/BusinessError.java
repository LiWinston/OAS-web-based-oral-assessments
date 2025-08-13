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
    USER_NOT_FOUND("2004", "User not found"),
    INVALID_CSV_TYPE("2005", "invalid CSV type"),
    
    // Epic 4.1 Course Management (Simplified) errors
    SUBJECT_NOT_FOUND("4021", "Course not found"),
    SUBJECT_ALREADY_EXISTS("4022", "Course already exists for this academic year and semester"),
    SUBJECT_ADMIN_INVALID("4023", "Invalid administrator for course"),
    SUBJECT_HAS_DEPENDENCIES("4024", "Course has dependent assignments"),
    SUBJECT_INVALID_YEAR("4025", "Invalid academic year"),
    SUBJECT_INVALID_SEMESTER("4026", "Invalid semester"),;
    
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