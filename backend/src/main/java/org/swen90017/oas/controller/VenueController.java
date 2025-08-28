package org.swen90017.oas.controller;


import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.service.VenueService;

@RestController
@RequestMapping("/api/superadmin/venues")
public class VenueController {
    @Autowired
    private VenueService venueService;

    @Operation(summary = "导入场地 CSV（按批UPSERT）")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result importVenues(@RequestPart("file") MultipartFile file,
                               @RequestParam(value = "batchSize", defaultValue = "1100") int batchSize) {
        venueService.importCsv(file, batchSize);
        return Result.success();
    }
}