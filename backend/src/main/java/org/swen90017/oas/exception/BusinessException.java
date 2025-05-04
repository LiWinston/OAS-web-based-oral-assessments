package org.swen90017.oas.exception;

import org.swen90017.oas.common.Error;

/**
 * Business exception class
 * Used to handle business logic related exceptions
 * 
 * @author Benyuan Wang
 */
public class BusinessException extends BaseException {
    private static final long serialVersionUID = 1L;

    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, String code) {
        super(message, code);
    }

    public BusinessException(Error error) {
        super(error.getMessage(), error.getCode());
    }
} 