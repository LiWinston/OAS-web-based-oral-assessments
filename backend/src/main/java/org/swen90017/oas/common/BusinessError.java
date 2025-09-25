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
    EXAMINER_NOT_FOUND("2008", "Examiner not found"),
    
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
    ASSIGNMENT_INVALID_WEIGHT_BASIS("4048", "Invalid weight basis, must be 'percentage' or 'points'"),
    ASSIGNMENT_INVALID_TOTAL_POINTS("4049", "Invalid total rubric points"),
    ASSIGNMENT_UPDATE_FAILED("4050", "Failed to update assignment"),

    // Epic 5 Timeslot and Session Management errors
    SESSION_CONFIG_NOT_FOUND("5001", "Session configuration not found or not configured"),
    TIME_CONFLICT("5002", "Time conflict detected"),
    VENUE_OVERLAP("5003", "Venue overlap detected"),
    VENUE_NOT_FOUND("5003A", "Venue not found"),
    VENUE_NOT_IN_ASSIGNMENT("5003B", "Venue does not belong to this assignment"),
    ASSIGNMENT_HAS_NO_VENUE("5003C", "No venue defined for this assignment"),
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
    FORBIDDEN("6006", "Operation not allowed"),

    // User Management (Assignment Members)
    ALREADY_IN_ASSIGNMENT("7001", "User already in this assignment"),

    // Generic / New session-era errors
    INVALID_PARAM("8000", "Invalid parameter"),
    SESSION_NOT_FOUND("8001", "Session not found"),
    VENUE_SESSION_OVERLAP("8002", "Venue session overlap detected"),
    EXCEEDS_MAX_SESSIONS("8003", "Exceeds examiner session limit"),
    SESSION_ASSIGNMENT_CONFLICT("8004", "Session assignment conflict"),
    EXAMINER_TIME_CONFLICT("8005", "Examiner has time conflict"),
    SESSION_NOT_STAFFED("8006", "Session has no assigned examiners"),
    SESSION_CONFLICT("8007", "Session conflict"),
    SESSION_HAS_BOOKINGS("8008", "Session has bookings"),
    STAFFING_INCOMPLETE("8009", "Staffing incomplete"),
    ALREADY_RELEASED("8010", "Already released"),

    // Assessment & Rubric errors (9000+)
    RUBRIC_INFO_EMPTY("9001", "Rubric info is empty"),
    RUBRIC_ITEMS_EMPTY("9002", "Rubric items are empty"),
    RUBRIC_CRITERION_NOT_FOUND("9003", "Rubric criterion not found"),
    RUBRIC_MISMATCH("9004", "Rubric mismatch"),
    SCORE_OUT_OF_RANGE("9005", "Score out of range"),
    INVALID_SELECTED_LEVEL("9006", "Invalid selected level"),
    RUBRIC_PARSE_ERROR("9007", "Rubric parse error"),
    NOT_ASSIGNED_TO_SESSION("9008", "Examiner not assigned to session"),
    ASSESSMENT_ALREADY_SUBMITTED("9009", "Assessment already submitted"),

    // Student Results domain
    NOT_RELEASED("410", "Results for this assignment haven't been released yet."),
    NOT_ASSESSED("423", "You weren't assessed for this assignment."),
    RESULT_NOT_FOUND("404", "Result not found"),
    RUBRIC_CRITERION_INCOMPLETE("9010", "Rubric criterion not fully completed"),
    INCOMPATIBLE_SCORE_FIELDS("9011", "Incompatible score fields for scaleType"),
    EXAMINER_LIMIT_NOT_SET("9012", "Examiner session limit not configured"),
    TOTAL_EXAMINER_CAPACITY_INSUFFICIENT("9013", "Total examiner capacity is insufficient"),
    
    // Admin results functionality errors (9014+)
    SUBMISSION_NOT_FOUND("9014", "Assessment submission not found"),
    EXAMINER_NOT_ASSIGNED_TO_SUBMISSION("9015", "Examiner is not assigned to this submission"),
    ALREADY_REOPENED("9016", "Examiner marking is already reopened"),
    NO_SUBMITTED_EXAMINERS("9017", "No examiners have submitted new markings for this assessment"),
    ASSESSMENT_ALREADY_RELEASED("9018", "Assessment is already released to students");
    // 9013 reserved: total capacity not sufficient
    // TOTAL_EXAMINER_CAPACITY_INSUFFICIENT("9013", "Total examiner capacity is insufficient")
    // add more below as needed


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