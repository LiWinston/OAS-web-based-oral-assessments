package org.swen90017.oas.enums;

/**
 * Account status enum
 * @author: Yun Chen
 */
public enum AccountStatus {
    /**
     * Normal account
     */
    NORMAL("0", "Normal"),
    
    /**
     * Banned account
     */
    BANNED("1", "Banned");
    
    private final String code;
    private final String desc;
    
    AccountStatus(String code, String desc) {
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
    public static AccountStatus getByCode(String code) {
        for (AccountStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return NORMAL;
    }
}
