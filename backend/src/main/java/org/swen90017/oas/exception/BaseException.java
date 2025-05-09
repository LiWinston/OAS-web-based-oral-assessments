package org.swen90017.oas.exception;

import org.swen90017.oas.common.Error;

/**
 * Base exception class for all custom exceptions
 *
 * @author Benyuan Wang
 */
public class BaseException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    /**
     * Error code
     */
    private String code;

    /**
     * Error message
     */
    private String message;

    /**
     * Detailed error message for internal debugging
     */
    private String detailMessage;

    public BaseException() {
    }

    public BaseException(String message) {
        this.message = message;
    }

    public BaseException(String message, String code) {
        this.message = message;
        this.code = code;
    }

    public BaseException(Error error) {
        this.message = error.getMessage();
        this.code = error.getCode();
    }

    public String getDetailMessage() {
        return detailMessage;
    }

    public void setDetailMessage(String detailMessage) {
        this.detailMessage = detailMessage;
    }

    @Override
    public String getMessage() {
        return message;
    }

    public String getCode() {
        return code;
    }
} 