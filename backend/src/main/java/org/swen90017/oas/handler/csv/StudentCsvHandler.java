package org.swen90017.oas.handler.csv;

import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.StudentCSVResponseDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.utils.CSVUtils;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.stream.Stream;

public class StudentCsvHandler implements CsvHandler<StudentCSVRequestDTO,StudentCSVResponseDTO> {

    @Override
    public List<StudentCSVRequestDTO> parse(InputStream csvInputStream) {
        try {
            return CSVUtils.readCsv(csvInputStream, StudentCSVRequestDTO.class);
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
    }

    @Override
    public void validate(List<StudentCSVRequestDTO> records) {
        Iterator<StudentCSVRequestDTO> iterator = records.iterator();

        while (iterator.hasNext()) {
            StudentCSVRequestDTO dto = iterator.next();

            if (isAllFieldsEmpty(dto)) {
                iterator.remove();
                continue;
            }

            // invalid line，like “Points Possible” / “(read only)”
            if ("Points Possible".equalsIgnoreCase(dto.getStudent().trim()) ||
                    "(read only)".equalsIgnoreCase(dto.getStudentId().trim())) {
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
