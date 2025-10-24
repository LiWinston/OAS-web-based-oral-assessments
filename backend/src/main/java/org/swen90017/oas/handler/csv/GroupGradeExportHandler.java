package org.swen90017.oas.handler.csv;

import cn.hutool.core.text.csv.CsvWriter;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.response.GroupGradeExportDTO;
import org.swen90017.oas.exception.BusinessException;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Group Grade Export CSV Handler
 */
public class GroupGradeExportHandler implements CsvHandler<Void, GroupGradeExportDTO> {

    @Override
    public List<Void> parse(InputStream csvInputStream) {
        throw new UnsupportedOperationException("Group grade export handler does not support import");
    }

    @Override
    public void validate(List<Void> records) {
        throw new UnsupportedOperationException("Group grade export handler does not support import");
    }

    @Override
    public String export(List<GroupGradeExportDTO> records) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {

            CsvWriter csvWriter = new CsvWriter(writer);

            // Build header
            List<String> headers = new ArrayList<>();
            headers.add("name");
            headers.add("canvas_user_id");
            headers.add("SIS ID");
            headers.add("login_id");
            headers.add("Section");
            headers.add("group_name");
            headers.add("canvas_group_id");

            // Add dynamic rubric columns from first record if exists
            if (!records.isEmpty() && records.get(0).getRubricScores() != null) {
                headers.addAll(records.get(0).getRubricScores().keySet());
            }

            csvWriter.writeHeaderLine(headers.toArray(new String[0]));

            // Write data rows
            for (GroupGradeExportDTO item : records) {
                List<String> row = new ArrayList<>();
                row.add(nvl(item.getName()));
                row.add(nvl(item.getCanvasUserId()));
                row.add(nvl(item.getSisId()));
                row.add(nvl(item.getLoginId()));
                row.add(nvl(item.getSection()));
                row.add(nvl(item.getGroupName()));
                row.add(nvl(item.getCanvasGroupId()));

                // Add rubric scores in same order as headers
                if (item.getRubricScores() != null) {
                    for (String key : item.getRubricScores().keySet()) {
                        row.add(nvl(item.getRubricScores().get(key)));
                    }
                }

                csvWriter.writeLine(row.toArray(new String[0]));
            }

            csvWriter.flush();
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_WRITE_FAILED);
        }
    }

    @Override
    public Class<Void> getImportType() {
        return Void.class;
    }

    @Override
    public Class<GroupGradeExportDTO> getExportType() {
        return GroupGradeExportDTO.class;
    }

    private String nvl(String value) {
        return value == null ? "" : value;
    }
}

