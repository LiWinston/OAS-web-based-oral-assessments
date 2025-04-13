package org.swen90017.oas.enums;

/**
 * Operation Type
 *
 * @author Yongchun Li
 */
//TODO: base Alibaba Java Coding Guidelines, need to add Enum fields
public enum OperationType {
    /**
     * Other
     */
    OTHER,

    /**
     * Insert
     */
    INSERT,

    /**
     * Update
     */
    UPDATE,

    /**
     * Delete
     */
    DELETE,

    /**
     * Query/Select
     */
    SELECT,

    /**
     * Grant
     */
    GRANT,

    /**
     * Export
     */
    EXPORT,

    /**
     * Import
     */
    IMPORT,

    /**
     * Force logout
     */
    FORCE_LOGOUT,

    /**
     * Generate code
     */
    GENERATE_CODE,

    /**
     * Clean data
     */
    CLEAN,

    /**
     * Upload
     */
    UPLOAD,

    /**
     * Download
     */
    DOWNLOAD
} 