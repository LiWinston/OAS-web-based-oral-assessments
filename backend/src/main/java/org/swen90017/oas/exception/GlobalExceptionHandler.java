package org.swen90017.oas.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.Result;

/**
 * Global Exception Handler
 *
 * @author Tianyun Lei
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle business exceptions
     */
    @ExceptionHandler(value = BusinessException.class)
    @ResponseBody
    public Result<Object> handleBusinessException(BusinessException e) {
        logger.error("Business exception", e);
        // 将部分业务错误映射为 HTTP 409（冲突）
        String code = e.getCode();
        if (code != null && (
                code.equals(org.swen90017.oas.common.BusinessError.SESSION_CONFLICT.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.SESSION_HAS_BOOKINGS.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.VENUE_SESSION_OVERLAP.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.SESSION_ASSIGNMENT_CONFLICT.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.EXCEEDS_MAX_SESSIONS.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.STAFFING_INCOMPLETE.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.ALREADY_RELEASED.getCode()) ||
                code.equals(org.swen90017.oas.common.BusinessError.EXAMINER_TIME_CONFLICT.getCode())
        )) {
            // 仍按统一 Result 返回，网关/前端据 code 识别 409 语义
            return Result.error(e.getCode(), e.getMessage());
        }
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * Handle validation exceptions
     */
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Result<Object> handleValidationException(MethodArgumentNotValidException e) {
        logger.error("Validation exception", e);
        return Result.error(BusinessError.BOOKING_VALIDATION_FAILED.getCode(), e.getMessage());
    }

    /**
     * Handle method not supported exceptions
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    @ResponseBody
    public Result<Object> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        logger.error("Method not supported", e);
        return Result.error(CommonError.BAD_REQUEST.getCode(), e.getMessage());
    }

    /**
     * Handle JSON parsing exceptions
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Result<Object> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        logger.error("Message not readable", e);
        return Result.error(CommonError.BAD_REQUEST.getCode(), "Invalid request format");
    }

    /**
     * Handle missing request parameter exceptions
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Result<Object> handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {
        logger.error("Missing request parameter", e);
        return Result.error(BusinessError.INVALID_PARAM.getCode(), String.format("Missing parameter: %s", e.getParameterName()));
    }

} 