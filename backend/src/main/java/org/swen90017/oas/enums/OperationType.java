package org.swen90017.oas.enums;

/**
 * Operation Type
 * With Field Name And Description
 *
 * @author Yongchun Li
 */
public enum OperationType {
    /**
     * Other
     */
    OTHER(0, "Other"),

    /**
     * Insert
     */
    INSERT(1, "Insert"),

    /**
     * Update
     */
    UPDATE(2, "Update"),

    /**
     * Delete
     */
    DELETE(3, "Delete"),

    /**
     * Query/Select
     */
    SELECT(4, "Select"),

    /**
     * Grant
     */
    GRANT(5, "Grant"),

    /**
     * Export
     */
    EXPORT(6, "Export"),

    /**
     * Import
     */
    IMPORT(7, "Import"),

    /**
     * Force logout
     */
    FORCE_LOGOUT(8, "Force Logout"),

    /**
     * Generate code
     */
    GENERATE_CODE(9, "Generate Code"),

    /**
     * Clean data
     */
    CLEAN(10, "Clean Data"),

    /**
     * Upload
     */
    UPLOAD(11, "Upload"),

    /**
     * Download
     */
    DOWNLOAD(12, "Download");

    private final int code;
    private final String description;

    OperationType(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }
}