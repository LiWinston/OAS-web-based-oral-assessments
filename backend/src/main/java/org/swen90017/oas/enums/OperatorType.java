package org.swen90017.oas.enums;

/**
 * Operator types in the system
 */
public enum OperatorType {
    /**
     * Other operator types
     */
    OTHER(0, "Other operator"),

    /**
     * Administrator
     */
    ADMIN(1, "Administrator"),

    /**
     * Examiner
     */
    EXAMINER(2, "Examiner"),
    
    /**
     * Student
     */
    STUDENT(3, "Student");
    
    private final int code;
    private final String info;
    
    OperatorType(int code, String info) {
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
     * Get OperatorType by code value
     *
     * @param code Code value
     * @return OperatorType enum
     */
    public static OperatorType getByCode(int code) {
        for (OperatorType type : values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        return OTHER;
    }
} 