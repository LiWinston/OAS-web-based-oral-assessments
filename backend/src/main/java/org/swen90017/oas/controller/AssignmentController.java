package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.request.ReleaseResultsRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusStatsResponseDTO;
import org.swen90017.oas.dto.response.AssignmentAvailabilityResponseDTO;
import org.swen90017.oas.dto.response.ReleaseResultsResponseDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentService;

import javax.validation.Valid;
import java.util.List;

/**
 * Assignment Controller
 * Provides basic CRUD REST API endpoints for Assignment management
 */
@Tag(name = "Assignment Management", description = "API endpoints for managing course assignments")
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * Get assignment by ID
     */
    @Operation(summary = "Get assignment by ID", description = "Retrieve a specific assignment by its ID")
    @GetMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentResponseDTO>> getAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long id) {
        AssignmentResponseDTO assignment = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Get assignments by subject ID
     */
    @Operation(summary = "Get assignments by subject ID", description = "Retrieve all assignments for a specific subject")
    @GetMapping("/subject/{subjectId}")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<AssignmentResponseDTO>>> getAssignmentsBySubject(
            @Parameter(description = "Subject ID") @PathVariable Long subjectId) {
        List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsBySubject(subjectId);
        return ResponseEntity.ok(Result.success(assignments));
    }

    /**
     * Get assignment count by subject ID
     */
    @Operation(summary = "Get assignment count by subject ID", description = "Retrieve assignment count for a specific subject (cached)")
    @GetMapping("/subject/{subjectId}/count")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Integer>> getAssignmentCountBySubject(
            @Parameter(description = "Subject ID") @PathVariable Long subjectId) {
        Integer count = assignmentService.getAssignmentCountBySubject(subjectId);
        return ResponseEntity.ok(Result.success(count));
    }

    /**
     * Create new assignment
     */
    @Operation(summary = "Create assignment", description = "Create a new assignment")
    @PostMapping
    @Log(module = "Assignment Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<AssignmentResponseDTO>> createAssignment(
            @Parameter(description = "Assignment creation data") @Valid @RequestBody AssignmentRequestDTO dto) {
        AssignmentResponseDTO assignment = assignmentService.createAssignment(dto);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Update existing assignment
     */
    @Operation(summary = "Update assignment", description = "Update an existing assignment")
    @PutMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<AssignmentResponseDTO>> updateAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long id, 
            @Parameter(description = "Assignment update data") @Valid @RequestBody AssignmentRequestDTO dto) {
        AssignmentResponseDTO assignment = assignmentService.updateAssignment(id, dto);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Delete assignment
     */
    @Operation(summary = "Delete assignment", description = "Delete an assignment")
    @DeleteMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok(Result.success(null));
    }

    /**
     * Get assignment status statistics
     */
    @Operation(summary = "Get assignment status statistics", description = "Retrieve statistics about assignment statuses across all subjects")
    @GetMapping("/stats")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentStatusStatsResponseDTO>> getAssignmentStatusStats() {
        AssignmentStatusStatsResponseDTO stats = assignmentService.getAssignmentStatusStats();
        return ResponseEntity.ok(Result.success(stats));
    }

    /**
     * Get assignment status statistics by subject ID
     */
    @Operation(summary = "Get assignment status statistics by subject", description = "Retrieve statistics about assignment statuses for a specific subject")
    @GetMapping("/subject/{subjectId}/stats")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentStatusStatsResponseDTO>> getAssignmentStatusStatsBySubject(
            @Parameter(description = "Subject ID") @PathVariable Long subjectId) {
        AssignmentStatusStatsResponseDTO stats = assignmentService.getAssignmentStatusStatsBySubject(subjectId);
        return ResponseEntity.ok(Result.success(stats));
    }

    /**
     * Get assignment availability for a specific student
     */
    @Operation(summary = "Get assignment availability", description = "Get assignment availability information including policies and quick stats for a specific student")
    @GetMapping("/{assignmentId}/availability")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentAvailabilityResponseDTO>> getAssignmentAvailability(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Student ID") @RequestParam Long studentId) {
        AssignmentAvailabilityResponseDTO availability = assignmentService.getAssignmentAvailability(assignmentId, studentId);
        return ResponseEntity.ok(Result.success(availability));
    }

    /**
     * Get assignment setup status
     */
    @Operation(summary = "Get assignment setup status", description = "Get the three-step setup progress information for an assignment")
    @GetMapping("/{assignmentId}/status")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentStatusResponseDTO>> getAssignmentStatus(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        AssignmentStatusResponseDTO status = assignmentService.getAssignmentStatus(assignmentId);
        return ResponseEntity.ok(Result.success(status));
    }

    /**
     * Release results for an assignment
     */
    @Operation(summary = "Release assignment results", description = "Release assignment results to students")
    @PostMapping("/{assignmentId}/results/release")
    @Log(module = "Assignment Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<ReleaseResultsResponseDTO>> releaseResults(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Release results request") @Valid @RequestBody ReleaseResultsRequestDTO request) {
        ReleaseResultsResponseDTO result = assignmentService.releaseResults(assignmentId, request);
        return ResponseEntity.ok(Result.success(result));
    }
}
