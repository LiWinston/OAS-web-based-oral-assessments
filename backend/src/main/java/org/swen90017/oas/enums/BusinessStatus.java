package org.swen90017.oas.enums;

/**
 * Operation status
 */
public enum BusinessStatus {
    /**
     * Success
     */
    SUCCESS(0, "Operation succeeded"),

    /**
     * Failure
     */
    FAIL(1, "Operation failed");
    
    private final int code;
    private final String info;
    
    BusinessStatus(int code, String info) {
        this.code = code;
        this.info = info;
    }
    
    public int getCode() {
        return code;
    }
    
    public String getInfo() {
        return info;
    }
    
    /**
     * Get BusinessStatus by code value
     *
     * @param code Code value
     * @return BusinessStatus enum
     */
    public static BusinessStatus getByCode(int code) {
        for (BusinessStatus status : values()) {
            if (status.getCode() == code) {
                return status;
            }
        }
        return SUCCESS;
    }
} 