package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.AcademicYearDto;
import org.swen90017.oas.entity.AcademicYear;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AcademicYearService;

import javax.validation.Valid;
import java.util.List;

/**
 * Academic Year Controller
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@RestController
@RequestMapping("/api/academic-years")
@RequiredArgsConstructor
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    /**
     * Get paginated academic years
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<IPage<AcademicYear>>> getAcademicYears(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String yearValue,
            @RequestParam(required = false) Boolean isActive) {
        
        IPage<AcademicYear> result = academicYearService.getAcademicYears(pageNum, pageSize, yearValue, isActive);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get all active academic years (for dropdown/selection)
     */
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<List<AcademicYear>>> getActiveAcademicYears() {
        List<AcademicYear> result = academicYearService.getActiveAcademicYears();
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Get academic year by ID
     */
    @GetMapping("/{yearId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<AcademicYear>> getAcademicYear(@PathVariable Long yearId) {
        AcademicYear result = academicYearService.getAcademicYearById(yearId);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Create academic year
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<AcademicYear>> createAcademicYear(@Valid @RequestBody AcademicYearDto dto) {
        AcademicYear result = academicYearService.createAcademicYear(dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Update academic year
     */
    @PutMapping("/{yearId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<AcademicYear>> updateAcademicYear(
            @PathVariable Long yearId, 
            @Valid @RequestBody AcademicYearDto dto) {
        AcademicYear result = academicYearService.updateAcademicYear(yearId, dto);
        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * Delete academic year (logical delete)
     */
    @DeleteMapping("/{yearId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Academic Year Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteAcademicYear(@PathVariable Long yearId) {
        academicYearService.deleteAcademicYear(yearId);
        return ResponseEntity.ok(Result.success());
    }
}
