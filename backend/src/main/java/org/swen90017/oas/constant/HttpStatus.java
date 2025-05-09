package org.swen90017.oas.constant;

/**
 * HTTP Status Codes
 * 
 * @author Yongchun Li
 */
public class HttpStatus
{
    /**
     * Operation successful
     */
    public static final int SUCCESS = 200;

    /**
     * Object created successfully
     */
    public static final int CREATED = 201;

    /**
     * Request has been accepted
     */
    public static final int ACCEPTED = 202;

    /**
     * Operation executed successfully, but no data returned
     */
    public static final int NO_CONTENT = 204;

    /**
     * Resource has been moved
     */
    public static final int MOVED_PERM = 301;

    /**
     * Redirect
     */
    public static final int SEE_OTHER = 303;

    /**
     * Resource not modified
     */
    public static final int NOT_MODIFIED = 304;

    /**
     * Parameter list error (missing, format mismatch)
     */
    public static final int BAD_REQUEST = 400;

    /**
     * Unauthorized
     */
    public static final int UNAUTHORIZED = 401;

    /**
     * Access restricted, authorization expired
     */
    public static final int FORBIDDEN = 403;

    /**
     * Resource or service not found
     */
    public static final int NOT_FOUND = 404;

    /**
     * HTTP method not allowed
     */
    public static final int BAD_METHOD = 405;

    /**
     * Resource conflict or resource locked
     */
    public static final int CONFLICT = 409;

    /**
     * Unsupported data or media type
     */
    public static final int UNSUPPORTED_TYPE = 415;

    /**
     * Internal system error
     */
    public static final int ERROR = 500;

    /**
     * Interface not implemented
     */
    public static final int NOT_IMPLEMENTED = 501;

    /**
     * System warning message
     */
    public static final int WARN = 601;
}
