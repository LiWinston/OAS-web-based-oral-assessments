package org.swen90017.oas.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom operation log recording annotation
 *
 * @author Yongchun Li
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
     * Operation type
     */
    String operType() default "";

    /**
     * Whether to save the request parameters
     */
    boolean isSaveRequestData() default true;
} 