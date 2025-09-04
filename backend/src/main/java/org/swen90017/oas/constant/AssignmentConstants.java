package org.swen90017.oas.constant;

/**
 * Assignment Constants
 * Defines default values and constants for assignment-related functionality
 */
public class AssignmentConstants {

    /**
     * Default visibility rule for assignments
     */
    public static final String DEFAULT_VISIBILITY_RULE = "ONLY_FULLY_STAFFED";

    /**
     * Default rescheduling enabled flag
     */
    public static final boolean DEFAULT_RESCHEDULING_ENABLED = true;

    /**
     * Default lockout enabled flag
     */
    public static final boolean DEFAULT_LOCKOUT_ENABLED = true;

    /**
     * Default lockout window in hours
     */
    public static final int DEFAULT_LOCKOUT_WINDOW_HOURS = 24;

    /**
     * Default polling hint in seconds
     */
    public static final int DEFAULT_POLLING_HINT_SECONDS = 30;

    /**
     * Default session duration in minutes
     */
    public static final int DEFAULT_SESSION_DURATION_MINUTES = 30;

    /**
     * Private constructor to prevent instantiation
     */
    private AssignmentConstants() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
}
