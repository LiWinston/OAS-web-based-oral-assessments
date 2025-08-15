package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.SubjectDto;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentService;
import org.swen90017.oas.service.SubjectService;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Course Controller (Frontend-Compatible API)
 * Provides simplified course management API that matches frontend expectations
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final SubjectService subjectService;
    private final AssignmentService assignmentService;

    /**
     * Get courses (matches frontend courseService.getCourses())
     */
    @GetMapping
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Map<String, Object>>> getCourses(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String courseCode,
            @RequestParam(required = false) Long adminUserId) {
        
        IPage<Subject> result = subjectService.getCourses(pageNum, pageSize, year, semester, 
                                                         courseCode, adminUserId, status);
        
        // Transform data to match frontend expectations
        Map<String, Object> response = new HashMap<>();
        response.put("data", transformToFrontendFormat(result.getRecords()));
        response.put("success", true);
        response.put("total", result.getTotal());
        response.put("current", result.getCurrent());
        response.put("size", result.getSize());
        
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Get course by ID
     */
    @GetMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Map<String, Object>>> getCourse(@PathVariable Long courseId) {
        Subject course = subjectService.getSubjectById(courseId);
        Map<String, Object> response = transformSingleToFrontendFormat(course);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Create course
     */
    @PostMapping
    @Log(module = "Course Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<Map<String, Object>>> createCourse(@Valid @RequestBody SubjectDto dto) {
        Subject course = subjectService.createCourse(dto);
        Map<String, Object> response = transformSingleToFrontendFormat(course);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Update course
     */
    @PutMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<Map<String, Object>>> updateCourse(
            @PathVariable Long courseId, 
            @Valid @RequestBody SubjectDto dto) {
        Subject course = subjectService.updateCourse(courseId, dto);
        Map<String, Object> response = transformSingleToFrontendFormat(course);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Delete course
     */
    @DeleteMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteCourse(@PathVariable Long courseId) {
        subjectService.deleteSubject(courseId);
        return ResponseEntity.ok(Result.success());
    }

    /**
     * Get course statistics for dashboard (Optimized with SQL aggregation)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<Map<String, Object>>> getCourseStats() {
        // Use optimized SQL aggregation query (single query instead of N+1)
        Map<String, Object> stats = subjectService.getCourseStatisticsOptimized();
        
        // Add current semester information
        String currentSemester = getCurrentSemesterOptimized();
        stats.put("currentSemester", currentSemester);
        
        // Placeholder for student count (would require enrollment data)
        stats.put("totalStudents", 0);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        
        return ResponseEntity.ok(Result.success(response));
    }
    
    /**
     * Determine current semester efficiently using optimized query
     */
    private String getCurrentSemesterOptimized() {
        Integer currentYear = subjectService.getLatestAcademicYear();
        
        // Determine semester based on current month
        java.time.LocalDate now = java.time.LocalDate.now();
        String semester;
        if (now.getMonthValue() >= 2 && now.getMonthValue() <= 6) {
            semester = "Semester 1";
        } else if (now.getMonthValue() >= 7 && now.getMonthValue() <= 11) {
            semester = "Semester 2";
        } else {
            semester = "Summer Term";
        }
        
        return currentYear + " " + semester;
    }

    /**
     * Transform Subject entities to frontend-expected format
     */
    private List<Map<String, Object>> transformToFrontendFormat(List<Subject> subjects) {
        return subjects.stream().map(this::transformSingleToFrontendFormat).collect(Collectors.toList());
    }

    /**
     * Transform single Subject entity to frontend format
     */
    private Map<String, Object> transformSingleToFrontendFormat(Subject subject) {
        Map<String, Object> course = new HashMap<>();
        course.put("id", subject.getSubjectId());
        course.put("courseName", subject.getSubjectName());
        course.put("courseCode", subject.getSubjectCode());
        course.put("academicYear", subject.getAcademicYear());
        course.put("semester", subject.getSemester());
        course.put("description", subject.getDescription());
        course.put("isActive", subject.getIsActive());
        course.put("status", subject.getStatus() != null ? subject.getStatus() : "active");
        course.put("students", 0); // Placeholder - would be calculated from actual enrollments
        
        // Get actual assignment count for this subject
        try {
            List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsBySubject(subject.getSubjectId());
            course.put("assignments", assignments.size());
        } catch (Exception e) {
            // In case of error, fall back to 0
            course.put("assignments", 0);
        }
        
        course.put("createdAt", subject.getCreateTime());
        return course;
    }
}
