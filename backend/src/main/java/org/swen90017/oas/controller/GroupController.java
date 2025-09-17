package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.service.StudentGroupQueryService;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class GroupController {

    private final StudentGroupQueryService studentGroupQueryService;

    @Operation(summary = "List student's active groups", description = "Overview of student's groups by assignment. Only groups with active assignments (not ended) are returned.")
    @GetMapping("/{studentId}/groups")
    @Log(module = "Student Groups", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Map<String, Object>>> listStudentGroups(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @RequestParam(value = "status", defaultValue = "active") String status,
            @RequestParam(value = "pageNum", defaultValue = "0") int pageNum,
            @RequestParam(value = "pageSize", defaultValue = "20") int pageSize,
            @RequestParam(value = "sort", defaultValue = "semester_desc") String sort,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince
    ) {
        StudentGroupQueryService.GroupListResponse response = studentGroupQueryService.listStudentGroups(studentId, status, pageNum, pageSize, sort, ifModifiedSince);

        if (response.isNotModified()) {
            return ResponseEntity.status(304).build();
        }

        HttpHeaders headers = new HttpHeaders();
        if (response.getLastModified() != null) {
            headers.add(HttpHeaders.LAST_MODIFIED, DateTimeFormatter.RFC_1123_DATE_TIME.format(response.getLastModified()));
            headers.add(HttpHeaders.CACHE_CONTROL, "private, must-revalidate");
        }

        java.util.Map<String, Object> page = new java.util.HashMap<>();
        page.put("pageNum", pageNum);
        page.put("pageSize", pageSize);
        page.put("total", response.getTotal());
        page.put("data", response.getData());

        return ResponseEntity.ok().headers(headers).body(Result.success(page));
    }

    @Operation(summary = "Get group details (members)", description = "Group members for a specific assignment-level group. Only returns details for groups with active assignments (not ended).")
    @GetMapping("/{studentId}/groups/{groupId}")
    @Log(module = "Student Groups", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Map<String, Object>>> getGroupDetails(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Group ID") @PathVariable Long groupId,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince
    ) {
        StudentGroupQueryService.GroupDetailResponse detail = studentGroupQueryService.getGroupDetail(studentId, groupId, ifModifiedSince);

        if (detail.isNotModified()) {
            return ResponseEntity.status(304).build();
        }

        HttpHeaders headers = new HttpHeaders();
        if (detail.getLastModified() != null) {
            headers.add(HttpHeaders.LAST_MODIFIED, DateTimeFormatter.RFC_1123_DATE_TIME.format(detail.getLastModified()));
            headers.add(HttpHeaders.CACHE_CONTROL, "private, must-revalidate");
        }

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("group", detail.getGroup());
        return ResponseEntity.ok().headers(headers).body(Result.success(data));
    }
}


