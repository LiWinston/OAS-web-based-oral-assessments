package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.response.StudentResultDetailDTO;
import org.swen90017.oas.dto.response.StudentResultOverviewDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.StudentResultsService;

@Tag(name = "Student Results", description = "API endpoints for student results and feedback")
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentResultsController {

    private final StudentResultsService studentResultsService;

    @Operation(summary = "List student's assignments with results")
    @GetMapping("/{studentId}/results")
    @Log(module = "Student Results", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<StudentResultOverviewDTO>> listStudentResults(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @RequestParam(defaultValue = "released") String status,
            @RequestParam(defaultValue = "current") String semester,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(defaultValue = "date_desc") String sort,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince) {
        StudentResultOverviewDTO data = studentResultsService.listStudentResults(studentId, status, semester, pageNum, pageSize, sort, ifModifiedSince);
        return ResponseEntity.ok(Result.success(data));
    }

    @Operation(summary = "Get assignment result detail")
    @GetMapping("/{studentId}/assignments/{assignmentId}/result")
    @Log(module = "Student Results", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<StudentResultDetailDTO>> getAssignmentResultDetail(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestHeader(value = "If-Modified-Since", required = false) String ifModifiedSince) {
        StudentResultDetailDTO data = studentResultsService.getAssignmentResultDetail(studentId, assignmentId, ifModifiedSince);
        return ResponseEntity.ok(Result.success(data));
    }
}

