package org.swen90017.oas.annotation;

import org.swen90017.oas.enums.QueryType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface QueryField {
    String column() default "";
    QueryType type() default QueryType.EQUAL;
}
