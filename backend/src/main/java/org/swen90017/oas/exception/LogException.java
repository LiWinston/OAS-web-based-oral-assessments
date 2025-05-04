package org.swen90017.oas.exception;

import org.swen90017.oas.common.Error;

/**
 * Log operation exception class
 * Used to handle log recording related exceptions
 * 
 * @author Benyuan Wang
 */
public class LogException extends BaseException {
    private static final long serialVersionUID = 1L;

    public LogException(String message) {
        super(message);
    }

    public LogException(String message, String code) {
        super(message, code);
    }

    public LogException(Error error) {
        super(error.getMessage(), error.getCode());
    }
} 