package org.swen90017.oas.common;

import java.io.Serializable;
import org.swen90017.oas.constant.HttpStatus;

/**
 * General operation result
 * @author: Yun Chen
 */
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    private boolean success;
    
    private String code;
    
    private T data;

    /**
     * Default constructor
     */
    public Result() {
    }

    /**
     * Constructor with error
     * 
     * @param error Error object
     */
    public Result(Error error) {
        this(error, null);
    }

    /**
     * Constructor with error and result
     * 
     * @param error Error object
     * @param result Result data (only used when success)
     */
    public Result(Error error, T result) {
        this(error.getCode(), error.getMessage(), result);
    }

    /**
     * Constructor with code and message
     * 
     * @param code Status code
     * @param message Message (used as error message when failure)
     */
    public Result(String code, String message) {
        this(code, message, null);
    }

    /**
     * Constructor with code, message and result
     * 
     * @param code Status code
     * @param message Message (used as error message when failure)
     * @param result Result data (only used when success)
     */
    @SuppressWarnings("unchecked")
    public Result(String code, String message, T result) {
        if (StatusCode.SUCCESS.getCode().equals(code)) {
            this.success = true;
            this.code = String.valueOf(HttpStatus.SUCCESS);
            this.data = result;
        } else {
            this.success = false;
            this.code = code;
            this.data = (T) message; // Cast message to T type as error message
        }
    }

    /**
     * Constructor with success flag, code and message
     * 
     * @param success Success flag
     * @param code Status code
     * @param message Message (used as error message when failure)
     */
    @SuppressWarnings("unchecked")
    public Result(boolean success, String code, String message) {
        this.success = success;
        if (success) {
            this.code = String.valueOf(HttpStatus.SUCCESS);
            this.data = null;
        } else {
            this.code = code;
            this.data = (T) message; // Cast message to T type as error message
        }
    }

    /**
     * Constructor with all parameters
     * 
     * @param success Success flag
     * @param code Status code
     * @param message Message (used as error message when failure)
     * @param result Result data (only used when success)
     */
    @SuppressWarnings("unchecked")
    public Result(boolean success, String code, String message, T result) {
        this.success = success;
        if (success) {
            this.code = String.valueOf(HttpStatus.SUCCESS);
            this.data = result;
        } else {
            this.code = code;
            this.data = (T) message; // Cast message to T type as error message
        }
    }

    /**
     * Create a success result
     * 
     * @param <T> Result type
     * @return Success result
     */
    public static <T> Result<T> success() {
        return new Result<>(true, String.valueOf(HttpStatus.SUCCESS), null);
    }

    /**
     * Create a success result with data
     * 
     * @param <T> Result type
     * @param data Result data
     * @return Success result with data
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(true, String.valueOf(HttpStatus.SUCCESS), null, data);
    }

    public static <T> Result<T> success(T data, String message) {
        return new Result<>(true, String.valueOf(HttpStatus.SUCCESS), message, data);
    }

    /**
     * Create an error result with error object
     * 
     * @param <T> Result type
     * @param error Error object
     * @return Error result
     */
    public static <T> Result<T> error(Error error) {
        return new Result<>(false, error.getCode(), error.getMessage());
    }

    /**
     * Create an error result with error code and message
     * 
     * @param <T> Result type
     * @param code Error code
     * @param message Error message
     * @return Error result
     */
    public static <T> Result<T> error(String code, String message) {
        return new Result<>(false, code, message);
    }
    
    /**
     * Create an error result with status code
     * 
     * @param <T> Result type
     * @param statusCode Status code
     * @return Error result
     */
    public static <T> Result<T> error(StatusCode statusCode) {
        return new Result<>(false, statusCode.getCode(), statusCode.getMessage());
    }

    public boolean isSuccess() {
        return this.success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getCode() {
        return this.code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public T getData() {
        return this.data;
    }

    public void setData(T result) {
        this.data = result;
    }

    @Override
    public String toString() {
        return "Result{code='" + this.code + '\'' + ", data=" + this.data + '}';
    }
} 