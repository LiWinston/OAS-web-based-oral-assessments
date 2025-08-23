package org.swen90017.oas.enums;

/**
 * User role enum
 * @author: Yun Chen
 */
public enum UserRole {
    /**
     * Admin role
     */
    ADMIN("ROLE_ADMIN", "Administrator",1L),
    
    /**
     * Examiner role
     */
    EXAMINER("ROLE_EXAMINER", "Examiner",2L),
    
    /**
     * Student role
     */
    STUDENT("ROLE_STUDENT", "Student",3L),

    SUPER_ADMIN("ROLE_SUPER_ADMIN", "Super Administrator",4L);
    
    private final String code;
    private final String desc;
    private final Long sort;
    
    UserRole(String code, String desc, Long sort) {
        this.code = code;
        this.desc = desc;
        this.sort = sort;
    }
    
    public String code() {
        return code;
    }
    
    public String desc() {
        return desc;
    }
    public Long sort() {
        return sort;
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