package org.swen90017.oas.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.enums.OperatorType;

/**
 * Custom operation log annotation
 */
@Target({ElementType.PARAMETER, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Log {
    /**
     * Module name
     */
    String module() default "";

    /**
     * Business operation type
     */
    BusinessType businessType() default BusinessType.OTHER;

    /**
     * Operator type
     */
    OperatorType operatorType() default OperatorType.OTHER;

    /**
     * Whether to save request data
     */
    boolean isSaveRequestData() default true;

    /**
     * Whether to save response data
     */
    boolean isSaveResponseData() default true;
    
    /**
     * Parameter names to exclude from the log
     */
    String[] excludeParamNames() default {};
} 