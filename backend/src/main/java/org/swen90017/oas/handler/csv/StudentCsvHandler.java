package org.swen90017.oas.handler.csv;

import cn.hutool.core.text.csv.CsvData;
import cn.hutool.core.text.csv.CsvReader;
import cn.hutool.core.text.csv.CsvUtil;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.StudentCSVResponseDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.utils.CSVUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Stream;

public class StudentCsvHandler implements CsvHandler<StudentCSVRequestDTO,StudentCSVResponseDTO> {

    @Override
    public List<StudentCSVRequestDTO> parse(InputStream csvInputStream) {
        try {
            // Read the stream into memory so we can validate header then parse
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            int read;
            while ((read = csvInputStream.read(tmp)) != -1) {
                buffer.write(tmp, 0, read);
            }
            byte[] bytes = buffer.toByteArray();

            // Validate header strictly
            try (Reader headerReader = new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8)) {
                CsvReader csvReader = CsvUtil.getReader();
                csvReader.setContainsHeader(true);
                CsvData data = csvReader.read(headerReader);
                List<String> header = data.getHeader();

                List<String> expected = Arrays.asList(
                        "Student",
                        "ID",
                        "SIS User ID",
                        "SIS Login ID",
                        "Section",
                        "Student Id"
                );

                if (header == null || header.size() != expected.size()) {
                    throw new BusinessException(BusinessError.INVALID_CSV_TYPE);
                }
                for (int i = 0; i < expected.size(); i++) {
                    String h = header.get(i) == null ? "" : header.get(i).replace("\uFEFF", "").trim();
                    if (!expected.get(i).equals(h)) {
                        throw new BusinessException(BusinessError.INVALID_CSV_TYPE);
                    }
                }
            }

            // Parse after validation
            return CSVUtils.readCsv(new ByteArrayInputStream(bytes), StudentCSVRequestDTO.class);
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
    }

    @Override
    public void validate(List<StudentCSVRequestDTO> records) {
        Iterator<StudentCSVRequestDTO> iterator = records.iterator();

        while (iterator.hasNext()) {
            StudentCSVRequestDTO dto = iterator.next();
            System.out.println("Validating record: " + dto);

            if (isAllFieldsEmpty(dto)) {
                iterator.remove();
                continue;
            }

            // invalid line，like “Points Possible” / “(read only)”
            if (("Points Possible".equalsIgnoreCase(Optional.ofNullable(dto.getStudent()).orElse("").trim())) ||
                    ("(read only)".equalsIgnoreCase(Optional.ofNullable(dto.getStudentId()).orElse("").trim()))) {
                iterator.remove();
            }

        }
    }

    @Override
    public String export(List<StudentCSVResponseDTO> records) {
        List<StudentCSVResponseDTO> exportList = new ArrayList<>();
        return CSVUtils.writeCsv(exportList, StudentCSVResponseDTO.class);
    }

    @Override
    public Class<StudentCSVRequestDTO> getImportType() {
        return StudentCSVRequestDTO.class;
    }
    @Override
    public Class<StudentCSVResponseDTO> getExportType() {
        return StudentCSVResponseDTO.class;
    }

    private boolean isAllFieldsEmpty(StudentCSVRequestDTO dto) {
        return Stream.of(
                dto.getStudent(), dto.getId(), dto.getSisUserId(),
                dto.getSisLoginId(), dto.getSection(), dto.getStudentId()
        ).allMatch(field -> field == null || field.trim().isEmpty());
    }

}
