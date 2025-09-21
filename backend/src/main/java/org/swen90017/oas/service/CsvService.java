package org.swen90017.oas.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

public interface CsvService {
    /**
     * Import CSV file and return the result as a list of objects.
     *
     * @param inputStream the input stream of the CSV file
     * @param type        the type of object to map the CSV data to
     * @return a list of objects mapped from the CSV data
     */
    <T,R> List<T> importCsv(InputStream inputStream, String type) throws IOException;
    
    /**
     * 构建邀请原因描述
     */
    String buildInviteReason(Long assignmentId);
}
