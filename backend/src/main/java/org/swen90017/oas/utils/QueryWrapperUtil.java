package org.swen90017.oas.utils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.swen90017.oas.annotation.QueryField;

import java.lang.reflect.Field;

/**
 * Utility class that dynamically builds a QueryWrapper based on an annotated query object.
 * <p>
 * Author: Yun
 * Created: 2025-04-12
 */
public class QueryWrapperUtil {
    /**
     * Builds a QueryWrapper instance using the given query object and entity class.
     *
     * @param query       The query object whose fields are used to generate query conditions.
     * @param entityClass The entity class associated with the query.
     * @param <T>         The type of the entity.
     * @param <Q>         The type of the query object.
     * @return A QueryWrapper with conditions generated from the query object's non-null fields.
     */
    public static <T, Q> QueryWrapper<T> build(Q query, Class<T> entityClass) {
        QueryWrapper<T> wrapper = new QueryWrapper<>();

        // Get all declared fields in the query object.
        Field[] fields = query.getClass().getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            Object value;
            try {
                value = field.get(query);
                if (value == null) continue;
            } catch (IllegalAccessException e) {
                continue;
            }

            QueryField annotation = field.getAnnotation(QueryField.class);
            if (annotation == null) continue;

            // Determine the database column name:
            // If the annotation's column property is empty, convert the field name from camelCase to underscore_case.
            // Otherwise, use the column name provided in the annotation.
            String columnName = annotation.column().isEmpty()
                    ? StringUtils.camelToUnderscore(field.getName())
                    : annotation.column();

            // Build the query condition based on the type defined in the annotation.
            switch (annotation.type()) {
                case EQUAL:
                    wrapper.eq(columnName, value);
                    break;
                case LIKE:
                    wrapper.like(columnName, value);
                    break;
                case GREATER_THAN:
                    wrapper.gt(columnName, value);
                    break;
                case GREATER_THAN_OR_EQUAL_TO:
                    wrapper.ge(columnName, value);
                    break;
                case LESS_THAN:
                    wrapper.lt(columnName, value);
                    break;
                case LESS_THAN_OR_EQUAL_TO:
                    wrapper.le(columnName, value);
                    break;
                case NOT_EQUAL:
                    wrapper.ne(columnName, value);
                    break;
                case NOT_LIKE:
                    wrapper.notLike(columnName, value);
                    break;
                case IS_NULL:
                    wrapper.isNull(columnName);
                    break;
                case IS_NOT_NULL:
                    wrapper.isNotNull(columnName);
                    break;
                default:
                    break;
            }
        }
        return wrapper;
    }

}
