package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.SubjectDto;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.SubjectService;

import javax.validation.Valid;
import java.util.List;

/**
 * Subject Controller
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    /**
     * Get paginated subjects
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<IPage<Subject>>> getSubjects(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) String subjectCode,
            @RequestParam(required = false) Long adminUserId,
            @RequestParam(required = false) Boolean isActive) {
        
        IPage<Subject> result = subjectService.getSubjects(pageNum, pageSize, semesterId, subjectCode, adminUserId, isActive);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get subjects by semester
     */
    @GetMapping("/by-semester/{semesterId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<Subject>>> getSubjectsBySemester(@PathVariable Long semesterId) {
        List<Subject> result = subjectService.getSubjectsBySemester(semesterId);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get subjects by admin user (for current admin to see their subjects)
     */
    @GetMapping("/my-subjects")
    @PreAuthorize("hasRole('ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<Subject>>> getMySubjects() {
        // In a real implementation, you would get the current user ID from the security context
        // For now, this is a placeholder that would need the actual user ID
        // Long currentUserId = getCurrentUserId();
        // List<Subject> result = subjectService.getSubjectsByAdmin(currentUserId);
        List<Subject> result = subjectService.getActiveSubjects(); // Temporary implementation
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get all active subjects (for dropdown/selection)
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<Subject>>> getActiveSubjects() {
        List<Subject> result = subjectService.getActiveSubjects();
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get subject by ID
     */
    @GetMapping("/{subjectId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Subject>> getSubject(@PathVariable Long subjectId) {
        Subject result = subjectService.getSubjectById(subjectId);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Create subject
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<Subject>> createSubject(@Valid @RequestBody SubjectDto dto) {
        Subject result = subjectService.createSubject(dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Update subject
     */
    @PutMapping("/{subjectId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<Subject>> updateSubject(
            @PathVariable Long subjectId, 
            @Valid @RequestBody SubjectDto dto) {
        Subject result = subjectService.updateSubject(subjectId, dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Delete subject (logical delete)
     */
    @DeleteMapping("/{subjectId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Subject Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteSubject(@PathVariable Long subjectId) {
        subjectService.deleteSubject(subjectId);
        return ResponseEntity.ok(Result.success());
    }
}
