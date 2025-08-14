package org.swen90017.oas.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentService;

import javax.validation.Valid;
import java.util.List;

/**
 * Assignment Controller
 * Provides basic CRUD REST API endpoints for Assignment management
 */
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * Get assignment by ID
     */
    @GetMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AssignmentResponseDTO>> getAssignment(@PathVariable Long id) {
        AssignmentResponseDTO assignment = assignmentService.getAssignmentById(id);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Get assignments by subject ID
     */
    @GetMapping("/subject/{subjectId}")
    @Log(module = "Assignment Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<AssignmentResponseDTO>>> getAssignmentsBySubject(@PathVariable Long subjectId) {
        List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsBySubject(subjectId);
        return ResponseEntity.ok(Result.success(assignments));
    }

    /**
     * Create new assignment
     */
    @PostMapping
    @Log(module = "Assignment Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<AssignmentResponseDTO>> createAssignment(@Valid @RequestBody AssignmentRequestDTO dto) {
        AssignmentResponseDTO assignment = assignmentService.createAssignment(dto);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Update existing assignment
     */
    @PutMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<AssignmentResponseDTO>> updateAssignment(
            @PathVariable Long id, 
            @Valid @RequestBody AssignmentRequestDTO dto) {
        AssignmentResponseDTO assignment = assignmentService.updateAssignment(id, dto);
        return ResponseEntity.ok(Result.success(assignment));
    }

    /**
     * Delete assignment
     */
    @DeleteMapping("/{id}")
    @Log(module = "Assignment Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok(Result.success(null));
    }
}
