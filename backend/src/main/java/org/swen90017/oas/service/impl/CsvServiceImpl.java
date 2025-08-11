package org.swen90017.oas.service.impl;

import org.springframework.stereotype.Service;
import org.swen90017.oas.handler.csv.CsvHandler;
import org.swen90017.oas.handler.csv.CsvHandlerFactory;
import org.swen90017.oas.service.CsvService;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
public class CsvServiceImpl implements CsvService {
    @Override
    public <T,R> List<T> importCsv(InputStream inputStream, String type) throws IOException {
        CsvHandler<T,R> handler = CsvHandlerFactory.getHandler(type);
        List<T> records = handler.parse(inputStream);
        handler.validate(records);
        return records;
    }
}
