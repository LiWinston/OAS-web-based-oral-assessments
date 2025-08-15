package org.swen90017.oas.handler.csv;

import cn.hutool.core.text.csv.CsvData;
import cn.hutool.core.text.csv.CsvReader;
import cn.hutool.core.text.csv.CsvUtil;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.AdminInviteDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.utils.CSVUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class AdminCsvHandler implements CsvHandler<AdminInviteDTO, Void> {

    @Override
    public List<AdminInviteDTO> parse(InputStream csvInputStream) {
        try {
            // Buffer the stream for header validation and parsing reuse
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
                        "Email",
                        "Name",
                        "Department",
                        "ID",
                        "SIS User ID",
                        "SIS Login ID"
                );

                if (header == null || header.size() < 3) {
                    throw new BusinessException(BusinessError.INVALID_CSV_TYPE);
                }

                for (int i = 0; i < expected.size(); i++) {
                    String h = header.size() > i && header.get(i) != null ? header.get(i).replace("\uFEFF", "").trim() : "";
                    if (!expected.get(i).equals(h)) {
                        throw new BusinessException(BusinessError.INVALID_CSV_TYPE);
                    }
                }
            }

            // Parse after validation
            return CSVUtils.readCsv(new ByteArrayInputStream(bytes), AdminInviteDTO.class);
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
    }

    @Override
    public void validate(List<AdminInviteDTO> records) {
        if (records == null) return;
        Iterator<AdminInviteDTO> it = records.iterator();
        while (it.hasNext()) {
            AdminInviteDTO dto = it.next();
            boolean allEmpty = (dto.getEmail() == null || dto.getEmail().trim().isEmpty())
                    && (dto.getName() == null || dto.getName().trim().isEmpty())
                    && (dto.getDepartment() == null || dto.getDepartment().trim().isEmpty())
                    && (dto.getMessage() == null || dto.getMessage().trim().isEmpty());
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
    public Class<AdminInviteDTO> getImportType() {
        return AdminInviteDTO.class;
    }

    @Override
    public Class<Void> getExportType() {
        return Void.class;
    }
}


