package org.swen90017.oas.enums;

/**
 * User role enum
 * @author: Yun Chen
 */
public enum UserRole {
    /**
     * Admin role
     */
    ADMIN("ROLE_ADMIN", "Administrator"),
    
    /**
     * Examiner role
     */
    EXAMINER("ROLE_EXAMINER", "Examiner"),
    
    /**
     * Student role
     */
    STUDENT("ROLE_STUDENT", "Student");
    
    private final String code;
    private final String desc;
    
    UserRole(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
    
    public String code() {
        return code;
    }
    
    public String desc() {
        return desc;
    }
    
    /**
     * Get enum by code
     */
    public static UserRole getByCode(String code) {
        for (UserRole role : values()) {
            if (role.code.equals(code)) {
                return role;
            }
        }
        return null;
    }
} 