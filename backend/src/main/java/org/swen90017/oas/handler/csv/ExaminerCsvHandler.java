package org.swen90017.oas.handler.csv;

import cn.hutool.core.text.csv.CsvData;
import cn.hutool.core.text.csv.CsvReader;
import cn.hutool.core.text.csv.CsvUtil;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.utils.CSVUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class ExaminerCsvHandler implements CsvHandler<ExaminerCSVRequestDTO, Void> {

    @Override
    public List<ExaminerCSVRequestDTO> parse(InputStream csvInputStream) {
        try {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            int read;
            while ((read = csvInputStream.read(tmp)) != -1) {
                buffer.write(tmp, 0, read);
            }
            byte[] bytes = buffer.toByteArray();

            try (Reader headerReader = new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8)) {
                CsvReader csvReader = CsvUtil.getReader();
                csvReader.setContainsHeader(true);
                CsvData data = csvReader.read(headerReader);
                List<String> header = data.getHeader();

                List<String> expected = Arrays.asList(
                        "Email",
                        "Name",
                        "Department",
                        "ID",
                        "SIS User ID",
                        "SIS Login ID"
                );

                if (header == null || header.size() < 3) {
                    throw new BusinessException(BusinessError.CSV_MISSING_HEADERS);
                }

                for (int i = 0; i < expected.size(); i++) {
                    String h = header.size() > i && header.get(i) != null ? header.get(i).replace("\uFEFF", "").trim() : "";
                    if (!expected.get(i).equals(h)) {
                        throw new BusinessException(BusinessError.CSV_HEADER_MISMATCH);
                    }
                }
            }

            return CSVUtils.readCsv(new ByteArrayInputStream(bytes), ExaminerCSVRequestDTO.class);
        } catch (Exception e) {
            throw new BusinessException(e.getMessage());
        }
    }

    @Override
    public void validate(List<ExaminerCSVRequestDTO> records) {
        if (records == null) return;
        Iterator<ExaminerCSVRequestDTO> it = records.iterator();
        while (it.hasNext()) {
            ExaminerCSVRequestDTO dto = it.next();
            boolean allEmpty = (dto.getName() == null || dto.getName().trim().isEmpty())
                    && (dto.getId() == null || dto.getId().trim().isEmpty())
                    && (dto.getSisUserId() == null || dto.getSisUserId().trim().isEmpty());
            if (allEmpty) {
                it.remove();
            }
        }
    }

    @Override
    public String export(List<Void> records) {
        return "";
    }

    @Override
    public Class<ExaminerCSVRequestDTO> getImportType() {
        return ExaminerCSVRequestDTO.class;
    }

    @Override
    public Class<Void> getExportType() {
        return Void.class;
    }
}


