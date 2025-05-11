package org.swen90017.oas.utils;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.text.csv.*;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.exception.BusinessException;

import java.io.*;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class CSVUtils {
    public static <T> List<T> readCsv(InputStream inputStream, Class<T> clazz) {
        try (Reader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8)) {
            CsvReader csvReader = CsvUtil.getReader();
            csvReader.setContainsHeader(true);

            CsvData data = csvReader.read(reader);
            List<String> header = data.getHeader();
            List<CsvRow> rows = data.getRows();

            List<T> result = new ArrayList<>();
            for (CsvRow row : rows) {
                Map<String, String> originalMap = row.getFieldMap();

                Map<String, String> normalizedMap = new HashMap<>();
                for (Map.Entry<String, String> entry : originalMap.entrySet()) {
                    String key = entry.getKey();
                    String value = entry.getValue();

                    String normalizedKey = StringUtils.spaceToCamelCase(key);
                    normalizedMap.put(normalizedKey, value);
                }

                T bean = BeanUtil.mapToBean(normalizedMap, clazz, true);
                result.add(bean);
            }


            return result;
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_READ_FAILED);
        }
    }

    public static <T> String writeCsv(List<T> data, Class<T> clazz) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8)) {

            CsvWriter csvWriter = new CsvWriter(writer);

            Field[] fields = clazz.getDeclaredFields();
            List<String> headers = Arrays.stream(fields)
                    .map(Field::getName)
                    .collect(Collectors.toList());
            csvWriter.writeHeaderLine(headers.toArray(new String[0]));

            for (T item : data) {
                List<String> row = new ArrayList<>();
                for (Field field : fields) {
                    field.setAccessible(true);
                    Object val = field.get(item);
                    row.add(Objects.toString(val, ""));
                }
                csvWriter.writeLine(row.toArray(new String[0]));
            }

            csvWriter.flush();
            return out.toString();
        } catch (Exception e) {
            throw new BusinessException(BusinessError.CSV_WRITE_FAILED);
        }
    }
    public static void main(String[] args) {
        File file = new File("/Users/chenyun/Downloads/Student List(in).csv");
        try (InputStream inputStream = new FileInputStream(file)) {
            List<StudentCSVRequestDTO> students = readCsv(inputStream, StudentCSVRequestDTO.class);
            System.out.println("Import success：");
            students.forEach(System.out::println);

            String csvOutput = writeCsv(students, StudentCSVRequestDTO.class);
            System.out.println("Exported CSV content:");
            System.out.println(csvOutput);

            File outFile = new File("/Users/chenyun/Downloads/Student List(out).csv");
            try (Writer fileWriter = new OutputStreamWriter(new FileOutputStream(outFile), StandardCharsets.UTF_8)) {
                fileWriter.write(csvOutput);
            }

            System.out.println("Export to file success: " + outFile.getAbsolutePath());

        } catch (Exception e) {
            System.err.println("Import Error：" + e.getMessage());
            e.printStackTrace();
        }
    }

}
