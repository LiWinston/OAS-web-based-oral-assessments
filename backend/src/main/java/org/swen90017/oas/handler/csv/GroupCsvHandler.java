package org.swen90017.oas.handler.csv;

import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.StudentCSVResponseDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.utils.CSVUtils;

import java.io.InputStream;
import java.util.List;

public class GroupCsvHandler implements CsvHandler<GroupCSVRequestDTO, Void>{

    @Override
    public List<GroupCSVRequestDTO> parse(InputStream csvInputStream) {
        try {
            return CSVUtils.readCsv(csvInputStream, GroupCSVRequestDTO.class);
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
    }

    @Override
    public String export(List records) {
        return null;
    }

    @Override
    public Class<GroupCSVRequestDTO> getImportType() {
        return GroupCSVRequestDTO.class;
    }

    @Override
    public Class getExportType() {
        return null;
    }

    @Override
    public void validate(List records) {

    }
}
