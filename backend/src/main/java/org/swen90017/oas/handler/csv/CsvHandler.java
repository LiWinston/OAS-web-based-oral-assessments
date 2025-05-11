package org.swen90017.oas.handler.csv;

import java.io.InputStream;
import java.util.List;

public interface CsvHandler<T,R> {
    List<T> parse(InputStream csvInputStream)  ;

    void validate(List<T> records)  ;

    String export(List<R> records)  ;

    Class<T> getImportType();
    Class<R> getExportType();
}
