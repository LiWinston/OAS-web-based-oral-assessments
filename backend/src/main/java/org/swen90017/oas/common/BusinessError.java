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
    CSV_MISSING_HEADERS("2006", "CSV headers missing or invalid"),
    CSV_HEADER_MISMATCH("2007", "CSV header does not match expected format"),
    
    // Epic 4.1 Course Management (Simplified) errors
    SUBJECT_NOT_FOUND("4021", "Course not found"),
    SUBJECT_ALREADY_EXISTS("4022", "Course already exists for this academic year and semester"),
    SUBJECT_ADMIN_INVALID("4023", "Invalid administrator for course"),
    SUBJECT_INVALID_YEAR("4025", "Invalid academic year"),
    SUBJECT_INVALID_SEMESTER("4026", "Invalid semester"),
    
    // Epic 4.2 Assignment Management errors
    ASSIGNMENT_NOT_FOUND("4031", "Assignment not found"),
    ASSIGNMENT_INVALID_TYPE("4032", "Invalid assignment type"),
    ASSIGNMENT_INVALID_DATES("4033", "Invalid assignment dates"),
    ASSIGNMENT_INVALID_WEIGHT("4034", "Invalid assignment weight"),
    ASSIGNMENT_INVALID_STATUS("4035", "Invalid assignment status"),
    ASSIGNMENT_INVALID_PROGRESS("4036", "Invalid assignment progress"),
    ASSIGNMENT_HAS_SUBMISSIONS("4037", "Assignment has submissions and cannot be deleted"),
    ASSIGNMENT_ALREADY_EXISTS("4038", "Assignment already exists for this subject"),
    ASSIGNMENT_INVALID_RUBRIC("4039", "Invalid rubric information"),
    ASSIGNMENT_INVALID_RUBRIC_WEIGHT("4040", "Invalid rubric weight"),
    ASSIGNMENT_INVALID_SCALE_TYPE("4041", "Invalid scale type"),
    ASSIGNMENT_INVALID_PERFORMANCE_LEVELS("4042", "Invalid performance levels"),
    ASSIGNMENT_INVALID_PERFORMANCE_DESCRIPTION("4043", "Invalid performance description"),
    ASSIGNMENT_INVALID_PERFORMANCE_POINTS("4044", "Invalid performance points"),
    ASSIGNMENT_INVALID_TOTAL_WEIGHT("4045", "Invalid total rubric weight"),
    ASSIGNMENT_INVALID_RUBRIC_FORMAT("4046", "Invalid rubric format"),
    ASSIGNMENT_TOTAL_WEIGHT_EXCEEDED("4047", "Total assignment weight for subject cannot exceed 100%"),

    // Epic 5 Timeslot and Session Management errors
    SESSION_CONFIG_NOT_FOUND("5001", "Session configuration not found or not configured"),
    TIME_CONFLICT("5002", "Time conflict detected"),
    VENUE_OVERLAP("5003", "Venue overlap detected"),
    TIME_SLOT_NOT_FOUND("5004", "Time slot not found"),
    SCHEDULE_NOT_READY("5005", "Schedule is not ready for release"),
    SESSION_GENERATION_FAILED("5006", "Failed to generate sessions for time slot"),
    ASSIGNMENT_RELEASED_IMMUTABLE("5007", "Assignment is released and cannot be modified"),
    EXCEEDS_REQUIRED_EXAMINERS("5008", "Assigned examiners exceed required count for time slot"),
    EXAMINER_LIMIT_INVALID("5009", "Invalid examiner limit payload"),
    INVALID_SESSION_CONFIG_EXAMINERS("5010", "Examiners per session must be at least 1"),
    
    // Epic 6 Student Booking errors
    SESSION_TAKEN("6001", "Session already taken"),
    ALREADY_BOOKED("6002", "Already has an active booking"),
    SLOT_UNSTAFFED("6003", "Time slot is not fully staffed"),
    DEADLINE_PASSED("6004", "Booking deadline has passed"),
    LOCKOUT_WINDOW("6005", "Booking is in lockout window"),
    FORBIDDEN("6006", "Operation not allowed");
    
  
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