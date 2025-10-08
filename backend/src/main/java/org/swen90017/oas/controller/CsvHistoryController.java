package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.CsvHistoryQueryDTO;
import org.swen90017.oas.dto.response.CsvImportHistoryDTO;
import org.swen90017.oas.service.CsvHistoryService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * CSV Import History Controller
 */
@Tag(name = "CSV Import History Management", description = "CSV import history related APIs")
@RestController
@RequestMapping("/api/csv/history")
public class CsvHistoryController {

    @Autowired
    private CsvHistoryService csvHistoryService;

    @Operation(summary = "Query CSV import history", description = "Query CSV import history with pagination, supports filtering by type, assignment, importer, etc.")
    @GetMapping("/list")
    public Result<PageResult<CsvImportHistoryDTO>> queryHistory(CsvHistoryQueryDTO queryDTO) {
        PageResult<CsvImportHistoryDTO> result = csvHistoryService.queryHistory(queryDTO);
        return Result.success(result);
    }

    @Operation(summary = "Get history record details", description = "Get CSV import history details by ID")
    @GetMapping("/{id}")
    public Result<CsvImportHistoryDTO> getHistoryById(@PathVariable Long id) {
        CsvImportHistoryDTO history = csvHistoryService.getHistoryById(id);
        return Result.success(history);
    }

    @Operation(summary = "Download CSV file", description = "Download CSV file by history record ID")
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadCsvFile(@PathVariable Long id) throws IOException {
        CsvImportHistoryDTO history = csvHistoryService.getHistoryById(id);
        Resource resource = csvHistoryService.downloadCsvFile(id);

        String encodedFilename = URLEncoder.encode(history.getOriginalFilename(), StandardCharsets.UTF_8.toString())
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFilename + "\"")
                .body(resource);
    }

    @Operation(summary = "Delete history record", description = "Delete CSV import history record and the associated file")
    @DeleteMapping("/{id}")
    public Result<Void> deleteHistory(@PathVariable Long id) {
        csvHistoryService.deleteHistory(id);
        return Result.success();
    }
}

