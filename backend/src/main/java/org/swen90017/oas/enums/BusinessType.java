package org.swen90017.oas.enums;

/**
 * Business operation types
 */
public enum BusinessType {
    /**
     * Other operations
     */
    OTHER(0, "Other operation"),

    /**
     * Insert operation
     */
    INSERT(1, "Insert operation"),

    /**
     * Update operation
     */
    UPDATE(2, "Update operation"),

    /**
     * Delete operation
     */
    DELETE(3, "Delete operation"),

    /**
     * Query operation
     */
    QUERY(4, "Query operation"),
    
    /**
     * Grant permissions
     */
    GRANT(5, "Grant permissions"),

    /**
     * Export data
     */
    EXPORT(6, "Export data"),

    /**
     * Import data
     */
    IMPORT(7, "Import data"),
    
    /**
     * Booking operation
     */
    BOOKING(8, "Booking operation"),
    
    /**
     * Cancel booking
     */
    CANCEL_BOOKING(9, "Cancel booking"),
    
    /**
     * Assessment operation
     */
    ASSESSMENT(10, "Assessment operation"),
    
    /**
     * Feedback operation
     */
    FEEDBACK(11, "Feedback operation");
    
    private final int code;
    private final String info;
    
    BusinessType(int code, String info) {
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
     * Get BusinessType by code value
     *
     * @param code Code value
     * @return BusinessType enum
     */
    public static BusinessType getByCode(int code) {
        for (BusinessType type : values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        return OTHER;
    }
} 