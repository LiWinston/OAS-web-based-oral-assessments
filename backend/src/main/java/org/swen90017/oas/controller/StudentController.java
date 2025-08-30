package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.StudentAssignmentQueryRequestDTO;
import org.swen90017.oas.dto.response.GroupContextResponseDTO;
import org.swen90017.oas.dto.response.StudentAssignmentListResponseDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentService;

/**
 * Student Controller
 * Provides REST API endpoints for student-related operations
 */
@Tag(name = "Student Management", description = "API endpoints for student operations")
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final AssignmentService assignmentService;

    /**
     * Get group context for a student in an assignment
     * Returns group information including members for group assignments
     */
    @Operation(summary = "Get group context", description = "Retrieve group context information for a student in an assignment")
    @GetMapping("/{studentId}/assignments/{assignmentId}/group")
    @Log(module = "Student Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<GroupContextResponseDTO>> getGroupContext(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        GroupContextResponseDTO groupContext = assignmentService.getGroupContext(studentId, assignmentId);
        return ResponseEntity.ok(Result.success(groupContext));
    }

    /**
     * List student's assignments with pagination and filters
     * Returns paginated list of assignments for a specific student
     */
    @Operation(summary = "List student assignments", description = "Retrieve paginated list of assignments for a student with optional filters")
    @GetMapping("/{studentId}/assignments")
    @Log(module = "Student Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<StudentAssignmentListResponseDTO>> listStudentAssignments(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Query parameters for assignment search") StudentAssignmentQueryRequestDTO queryDTO) {
        StudentAssignmentListResponseDTO assignments = assignmentService.getStudentAssignments(studentId, queryDTO);
        return ResponseEntity.ok(Result.success(assignments));
    }
}
