package org.swen90017.oas.exception;

/**
 * Authorization exception for handling permission related errors
 *
 * @author Benyuan Wang
 */
public class AuthorizationException extends BaseException {
    private static final long serialVersionUID = 1L;

    public AuthorizationException(String message) {
        super(message);
    }

    public AuthorizationException(String message, String code) {
        super(message, code);
    }
} 