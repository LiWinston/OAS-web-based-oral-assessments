package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.SemesterDto;
import org.swen90017.oas.entity.Semester;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.SemesterService;

import javax.validation.Valid;
import java.util.List;

/**
 * Semester Controller
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    /**
     * Get paginated semesters
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<IPage<Semester>>> getSemesters(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) Boolean isActive) {
        
        IPage<Semester> result = semesterService.getSemesters(pageNum, pageSize, academicYearId, isActive);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get semesters by academic year
     */
    @GetMapping("/by-academic-year/{academicYearId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<Semester>>> getSemestersByAcademicYear(@PathVariable Long academicYearId) {
        List<Semester> result = semesterService.getSemestersByAcademicYear(academicYearId);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get all active semesters (for dropdown/selection)
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<Semester>>> getActiveSemesters() {
        List<Semester> result = semesterService.getActiveSemesters();
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get semester by ID
     */
    @GetMapping("/{semesterId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Semester>> getSemester(@PathVariable Long semesterId) {
        Semester result = semesterService.getSemesterById(semesterId);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Create semester
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<Semester>> createSemester(@Valid @RequestBody SemesterDto dto) {
        Semester result = semesterService.createSemester(dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Update semester
     */
    @PutMapping("/{semesterId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<Semester>> updateSemester(
            @PathVariable Long semesterId, 
            @Valid @RequestBody SemesterDto dto) {
        Semester result = semesterService.updateSemester(semesterId, dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Delete semester (logical delete)
     */
    @DeleteMapping("/{semesterId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Semester Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteSemester(@PathVariable Long semesterId) {
        semesterService.deleteSemester(semesterId);
        return ResponseEntity.ok(Result.success());
    }
}
