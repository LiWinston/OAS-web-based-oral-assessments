package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.SubjectDto;
import org.swen90017.oas.dto.request.CourseCreateRequestDTO;
import org.swen90017.oas.dto.request.CourseQueryRequestDTO;
import org.swen90017.oas.dto.request.CourseUpdateRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.CourseListResponseDTO;
import org.swen90017.oas.dto.response.CourseResponseDTO;
import org.swen90017.oas.dto.response.CourseStatsResponseDTO;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentService;
import org.swen90017.oas.service.SubjectService;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Course Controller (Frontend-Compatible API)
 * Provides simplified course management API that matches frontend expectations
 */
@Tag(name = "Course Management", description = "API endpoints for managing academic courses")
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final SubjectService subjectService;
    private final AssignmentService assignmentService;

    /**
     * Get courses with pagination and filters
     */
    @Operation(summary = "Get courses", description = "Retrieve courses with pagination and optional filters")
    @GetMapping
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseListResponseDTO> getCourses(
            @Parameter(description = "Query parameters for course search") CourseQueryRequestDTO queryDTO) {
        
        IPage<Subject> result = subjectService.getCourses(
            queryDTO.getPageNum(), 
            queryDTO.getPageSize(), 
            queryDTO.getYear(), 
            queryDTO.getSemester(), 
            queryDTO.getCourseCode(), 
            queryDTO.getAdminUserId(), 
            queryDTO.getStatus()
        );
        
        // Transform data to CourseResponseDTO
        List<CourseResponseDTO> courseDTOs = result.getRecords().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        CourseListResponseDTO response = new CourseListResponseDTO(
            courseDTOs, 
            result.getTotal(), 
            result.getCurrent(), 
            result.getSize()
        );
        
        return Result.success(response);
    }

    /**
     * Get course by ID
     */
    @Operation(summary = "Get course by ID", description = "Retrieve a specific course by its ID")
    @GetMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseResponseDTO> getCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        Subject course = subjectService.getSubjectById(courseId);
        CourseResponseDTO response = convertToDTO(course);
        return Result.success(response);
    }

    /**
     * Create course
     */
    @Operation(summary = "Create course", description = "Create a new academic course")
    @PostMapping
    @Log(module = "Course Management", businessType = BusinessType.INSERT)
    public Result<CourseResponseDTO> createCourse(
            @Parameter(description = "Course creation data") @Valid @RequestBody CourseCreateRequestDTO requestDTO) {
        // Convert request DTO to SubjectDto
        SubjectDto dto = convertCreateRequestToSubjectDto(requestDTO);
        Subject course = subjectService.createCourse(dto);
        CourseResponseDTO response = convertToDTO(course);
        return Result.success(response);
    }

    /**
     * Update course
     */
    @Operation(summary = "Update course", description = "Update an existing course")
    @PutMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.UPDATE)
    public Result<CourseResponseDTO> updateCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId, 
            @Parameter(description = "Course update data") @Valid @RequestBody CourseUpdateRequestDTO requestDTO) {
        // Convert request DTO to SubjectDto
        SubjectDto dto = convertUpdateRequestToSubjectDto(requestDTO);
        Subject course = subjectService.updateCourse(courseId, dto);
        CourseResponseDTO response = convertToDTO(course);
        return Result.success(response);
    }

    /**
     * Delete course
     */
    @Operation(summary = "Delete course", description = "Delete a course and its associated assignments")
    @DeleteMapping("/{courseId}")
    @Log(module = "Course Management", businessType = BusinessType.DELETE)
    public Result<Void> deleteCourse(
            @Parameter(description = "Course ID") @PathVariable Long courseId) {
        subjectService.deleteSubject(courseId);
        return Result.success();
    }

    /**
     * Get course statistics for dashboard (Optimized with SQL aggregation)
     */
    @Operation(summary = "Get course statistics", description = "Retrieve dashboard statistics for courses")
    @GetMapping("/stats")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseStatsResponseDTO> getCourseStats() {
        // Use optimized SQL aggregation query (single query instead of N+1)
        Map<String, Object> stats = subjectService.getCourseStatisticsOptimized();
        
        // Add current semester information
        String currentSemester = getCurrentSemesterOptimized();
        
        CourseStatsResponseDTO response = new CourseStatsResponseDTO(
            (Integer) stats.get("totalCourses"),
            (Integer) stats.get("activeCourses"),
            0, // Placeholder for student count
            (Integer) stats.get("totalAssignments"),
            currentSemester
        );
        
        return Result.success(response);
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
     * Convert Subject entity to CourseResponseDTO
     */
    private CourseResponseDTO convertToDTO(Subject subject) {
        CourseResponseDTO dto = new CourseResponseDTO();
        dto.setId(subject.getSubjectId());
        dto.setCourseCode(subject.getSubjectCode());
        dto.setCourseName(subject.getSubjectName());
        dto.setDescription(subject.getDescription());
        dto.setAcademicYear(subject.getAcademicYear());
        dto.setSemester(subject.getSemester());
        dto.setAdminUserId(subject.getAdminUserId());
        dto.setIsActive(subject.getIsActive());
        dto.setStatus(subject.getStatus() != null ? subject.getStatus() : "active");
        dto.setStudents(0); // Placeholder - would be calculated from actual enrollments
        
        // Get actual assignment count for this subject
        try {
            List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsBySubject(subject.getSubjectId());
            dto.setAssignments(assignments.size());
        } catch (Exception e) {
            // In case of error, fall back to 0
            dto.setAssignments(0);
        }
        
        dto.setCreateTime(subject.getCreateTime());
        dto.setCreator(subject.getCreator());
        dto.setUpdateTime(subject.getUpdateTime());
        dto.setUpdater(subject.getUpdater());
        
        return dto;
    }
    
    /**
     * Convert CourseCreateRequestDTO to SubjectDto
     */
    private SubjectDto convertCreateRequestToSubjectDto(CourseCreateRequestDTO requestDTO) {
        SubjectDto dto = new SubjectDto();
        dto.setSubjectCode(requestDTO.getCourseCode());
        dto.setSubjectName(requestDTO.getCourseName());
        dto.setDescription(requestDTO.getDescription());
        dto.setAcademicYear(requestDTO.getAcademicYear());
        dto.setSemester(requestDTO.getSemester());
        dto.setAdminUserId(requestDTO.getAdminUserId());
        dto.setStatus(requestDTO.getStatus());
        return dto;
    }
    
    /**
     * Convert CourseUpdateRequestDTO to SubjectDto
     */
    private SubjectDto convertUpdateRequestToSubjectDto(CourseUpdateRequestDTO requestDTO) {
        SubjectDto dto = new SubjectDto();
        dto.setSubjectCode(requestDTO.getCourseCode());
        dto.setSubjectName(requestDTO.getCourseName());
        dto.setDescription(requestDTO.getDescription());
        dto.setAcademicYear(requestDTO.getAcademicYear());
        dto.setSemester(requestDTO.getSemester());
        dto.setAdminUserId(requestDTO.getAdminUserId());
        dto.setStatus(requestDTO.getStatus());
        dto.setIsActive(requestDTO.getIsActive());
        return dto;
    }
}
