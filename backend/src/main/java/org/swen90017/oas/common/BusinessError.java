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
    
    // Epic 4.1 Academic Structure Management errors
    ACADEMIC_YEAR_NOT_FOUND("4001", "Academic year not found"),
    ACADEMIC_YEAR_ALREADY_EXISTS("4002", "Academic year already exists"),
    ACADEMIC_YEAR_DATE_INVALID("4003", "Academic year date range is invalid"),
    ACADEMIC_YEAR_HAS_DEPENDENCIES("4004", "Academic year has dependent semesters"),
    
    SEMESTER_NOT_FOUND("4011", "Semester not found"),
    SEMESTER_ALREADY_EXISTS("4012", "Semester already exists for this academic year"),
    SEMESTER_DATE_INVALID("4013", "Semester date range is invalid"),
    SEMESTER_DATE_OUT_OF_RANGE("4014", "Semester dates must be within academic year range"),
    SEMESTER_HAS_DEPENDENCIES("4015", "Semester has dependent subjects"),
    
    SUBJECT_NOT_FOUND("4021", "Subject not found"),
    SUBJECT_ALREADY_EXISTS("4022", "Subject already exists for this semester"),
    SUBJECT_ADMIN_INVALID("4023", "Invalid administrator for subject"),
    SUBJECT_HAS_DEPENDENCIES("4024", "Subject has dependent assignments"),;
    
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