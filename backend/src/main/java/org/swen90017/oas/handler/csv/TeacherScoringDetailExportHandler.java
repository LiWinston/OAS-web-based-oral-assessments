package org.swen90017.oas.handler.csv;

import cn.hutool.core.text.csv.CsvWriter;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.response.TeacherScoringDetailExportDTO;
import org.swen90017.oas.exception.BusinessException;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Teacher Scoring Detail Export CSV Handler
 */
public class TeacherScoringDetailExportHandler implements CsvHandler<Void, TeacherScoringDetailExportDTO> {

    @Override
    public List<Void> parse(InputStream csvInputStream) {
        throw new UnsupportedOperationException("Teacher scoring detail export handler does not support import");
    }

    @Override
    public void validate(List<Void> records) {
        throw new UnsupportedOperationException("Teacher scoring detail export handler does not support import");
    }

    @Override
    public String export(List<TeacherScoringDetailExportDTO> records) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {

            CsvWriter csvWriter = new CsvWriter(writer);

            List<String> headers = new ArrayList<>();
            headers.add("name");
            headers.add("canvas_user_id");
            headers.add("SIS ID");
            headers.add("login_id");
            headers.add("Section");
            headers.add("group_name");
            headers.add("canvas_group_id");
            headers.add("exam_date");
            headers.add("exam_time_slot");
            headers.add("exam_venue");

            int maxExaminerCount = records.stream()
                    .mapToInt(r -> r.getExaminerScores() != null ? r.getExaminerScores().size() : 0)
                    .max()
                    .orElse(0);

            List<String> rubricColumns = new ArrayList<>();
            for (TeacherScoringDetailExportDTO record : records) {
                if (record.getRubricAverageScores() != null && !record.getRubricAverageScores().isEmpty()) {
                    rubricColumns.addAll(record.getRubricAverageScores().keySet());
                    break;
                }
            }

            for (int i = 1; i <= maxExaminerCount; i++) {
                headers.add("examiner" + i + "_examiner_name");
                headers.add("examiner" + i + "_examiner_username");
                for (String rubric : rubricColumns) {
                    headers.add("examiner" + i + "_" + rubric);
                }
            }

            for (String rubric : rubricColumns) {
                headers.add(rubric + "_avg");
            }

            csvWriter.writeHeaderLine(headers.toArray(new String[0]));

            // Write data rows
            for (TeacherScoringDetailExportDTO item : records) {
                List<String> row = new ArrayList<>();
                row.add(nvl(item.getName()));
                row.add(nvl(item.getCanvasUserId()));
                row.add(nvl(item.getSisId()));
                row.add(nvl(item.getLoginId()));
                row.add(nvl(item.getSection()));
                row.add(nvl(item.getGroupName()));
                row.add(nvl(item.getCanvasGroupId()));
                row.add(nvl(item.getExamDate()));
                row.add(nvl(item.getExamTimeSlot()));
                row.add(nvl(item.getExamVenue()));

                List<TeacherScoringDetailExportDTO.ExaminerScore> examinerScores =
                        item.getExaminerScores() != null ? item.getExaminerScores() : new ArrayList<>();

                for (int i = 0; i < maxExaminerCount; i++) {
                    if (i < examinerScores.size()) {
                        TeacherScoringDetailExportDTO.ExaminerScore examinerScore = examinerScores.get(i);
                        row.add(nvl(examinerScore.getExaminerName()));
                        row.add(nvl(examinerScore.getExaminerUsername()));

                        Map<String, String> rubricScores = examinerScore.getRubricScores();
                        for (String rubric : rubricColumns) {
                            row.add(rubricScores != null ? nvl(rubricScores.get(rubric)) : "");
                        }
                    } else {
                        row.add("");
                        row.add("");
                        for (int j = 0; j < rubricColumns.size(); j++) {
                            row.add("");
                        }
                    }
                }

                Map<String, String> averageScores = item.getRubricAverageScores();
                for (String rubric : rubricColumns) {
                    row.add(averageScores != null ? nvl(averageScores.get(rubric)) : "");
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
    public Class<TeacherScoringDetailExportDTO> getExportType() {
        return TeacherScoringDetailExportDTO.class;
    }

    private String nvl(String value) {
        return value == null ? "" : value;
    }
}

