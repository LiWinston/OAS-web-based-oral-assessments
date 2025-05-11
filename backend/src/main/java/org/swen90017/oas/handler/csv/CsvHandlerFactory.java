package org.swen90017.oas.handler.csv;

import org.apache.ibatis.builder.BuilderException;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.exception.BusinessException;

import java.util.HashMap;
import java.util.Map;

public class CsvHandlerFactory {

    private static final Map<String, CsvHandler<?,?>> handlers = new HashMap<>();

    static {
        handlers.put("student", new StudentCsvHandler());
    }

    @SuppressWarnings("unchecked")
    public static <T,R> CsvHandler<T,R> getHandler(String type) {
        CsvHandler<T,R> handler = (CsvHandler<T,R>) handlers.get(type.toLowerCase());
        if (handler == null) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
        return handler;
    }
}
