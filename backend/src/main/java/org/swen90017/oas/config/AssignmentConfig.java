package org.swen90017.oas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

/**
 * Assignment Configuration
 * Manages assignment-related configuration values
 */
@Configuration
@ConfigurationProperties(prefix = "oas.assignment")
@Data
public class AssignmentConfig {

    /**
     * Default visibility rule for assignments
     */
    private String defaultVisibilityRule = "ONLY_FULLY_STAFFED";

    /**
     * Default rescheduling enabled flag
     */
    private Boolean defaultReschedulingEnabled = true;

    /**
     * Default lockout enabled flag
     */
    private Boolean defaultLockoutEnabled = true;

    /**
     * Default lockout window in hours
     */
    private Integer defaultLockoutWindowHours = 24;

    /**
     * Default polling hint in seconds
     */
    private Integer defaultPollingHintSeconds = 30;

    /**
     * Default session duration in minutes
     */
    private Integer defaultSessionDurationMinutes = 30;
}
