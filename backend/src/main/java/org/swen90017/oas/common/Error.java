package org.swen90017.oas.common;

/**
 * Error interface definition
 * All error enums should implement this interface
 * @author: Yun Chen
 */
public interface Error {
    /**
     * Get error code
     * 
     * @return Error code
     */
    String getCode();
    
    /**
     * Get error message
     * 
     * @return Error message
     */
    String getMessage();
} 