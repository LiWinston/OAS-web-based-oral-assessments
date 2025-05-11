package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.service.CsvService;

import java.io.IOException;
import java.util.List;
@RestController
@RequestMapping("/api/csv")
public class CsvController {
    @Autowired
    private CsvService csvService;

    @PostMapping("/import")
    public Result importCsv(@RequestParam("file") MultipartFile file,
                            @RequestParam("type") String type) throws IOException {
        List<?> result = csvService.importCsv(file.getInputStream(), type);
        return Result.success(result);
    }
}
