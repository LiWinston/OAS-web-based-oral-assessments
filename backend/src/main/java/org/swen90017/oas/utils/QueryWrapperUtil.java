package org.swen90017.oas.utils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.swen90017.oas.annotation.QueryField;

import java.lang.reflect.Field;

public class QueryWrapperUtil {
    public static <T, Q> QueryWrapper<T> build(Q query, Class<T> entityClass) {
        QueryWrapper<T> wrapper = new QueryWrapper<>();

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

            String columnName = annotation.column().isEmpty()
                    ? StringUtils.camelToUnderscore(field.getName())
                    : annotation.column();

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
                default:
                    break;
            }
        }
        return wrapper;
    }

}
