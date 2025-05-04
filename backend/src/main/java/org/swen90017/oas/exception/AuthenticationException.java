package org.swen90017.oas.exception;

/**
 * Authentication exception for handling authentication related errors
 *
 * @author Benyuan Wang
 */
public class AuthenticationException extends BaseException {
    private static final long serialVersionUID = 1L;

    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, String code) {
        super(message, code);
    }
} 