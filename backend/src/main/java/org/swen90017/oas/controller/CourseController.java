package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.SubjectDto;
import org.swen90017.oas.dto.request.CourseCreateRequestDTO;
import org.swen90017.oas.dto.request.CourseQueryRequestDTO;
import org.swen90017.oas.dto.request.CourseUpdateRequestDTO;

import org.swen90017.oas.dto.response.CourseListResponseDTO;
import org.swen90017.oas.dto.response.CourseResponseDTO;
import org.swen90017.oas.dto.response.CourseStatsResponseDTO;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.service.AssignmentService;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.entity.LoginUser;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Course Controller (Frontend-Compatible API)
 * Provides simplified course management API that matches frontend expectations
 */
@Slf4j
@Tag(name = "Course Management", description = "API endpoints for managing academic courses")
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final SubjectService subjectService;
    private final AssignmentService assignmentService;

    /**
     * List courses with pagination and filters (POST method for complex query)
     */
    @Operation(summary = "List courses", description = "Retrieve courses with pagination and optional filters using POST")
    @PostMapping("/list")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseListResponseDTO> listCourses(
            @Parameter(description = "Query parameters for course search") @RequestBody CourseQueryRequestDTO queryDTO) {
        
        IPage<Subject> result = subjectService.getCourses(
            queryDTO.getPageNum(), 
            queryDTO.getPageSize(), 
            queryDTO.getYear(), 
            queryDTO.getSemester(), 
            queryDTO.getCourseCode(), 
            queryDTO.getAdminUserId(), 
            queryDTO.getStatus(),
            queryDTO.getIsActive()
        );
        
        // Transform data to CourseResponseDTO with dual-path optimization
        List<CourseResponseDTO> courseDTOs = convertToDTOsWithDualPath(result.getRecords());
        
        CourseListResponseDTO response = new CourseListResponseDTO(
            courseDTOs, 
            result.getTotal(), 
            result.getCurrent(), 
            result.getSize()
        );
        
        return Result.success(response);
    }

    /**
     * List courses with pagination and filters (GET method for simple queries)
     */
    @Operation(summary = "List courses (GET)", description = "Retrieve courses the current course admin can read with optional pagination and filters")
    @GetMapping
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseListResponseDTO> listCoursesGet(
            @Parameter(description = "Query parameters for course search") CourseQueryRequestDTO queryDTO) {

        // Enforce visibility: non-super-admins can only see their own courses
        String role = SecurityUtils.getUserRole();
        if (!UserRole.SUPER_ADMIN.code().equals(role)) {
            LoginUser currentUser = SecurityUtils.getLoginUser();
            if (currentUser != null) {
                queryDTO.setAdminUserId(currentUser.getUserId());
            }
        }

        IPage<Subject> result = subjectService.getCourses(
            queryDTO.getPageNum(),
            queryDTO.getPageSize(),
            queryDTO.getYear(),
            queryDTO.getSemester(),
            queryDTO.getCourseCode(),
            queryDTO.getAdminUserId(),
            queryDTO.getStatus(),
            queryDTO.getIsActive()
        );

        List<CourseResponseDTO> courseDTOs = convertToDTOsWithDualPath(result.getRecords());
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
        
        // Optimized: use lightweight conversion for new course (no assignment count query needed)
        CourseResponseDTO response = convertToDTOForCreate(course);
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
     * Get course statistics (Optimized with SQL aggregation)
     * @param adminUserId Optional admin user ID. If provided, returns stats for specific admin; if null, returns global stats
     */
    @Operation(summary = "Get course statistics", description = "Retrieve dashboard statistics for courses. Optional adminUserId parameter for specific admin stats")
    @GetMapping("/stats")
    @Log(module = "Course Management", businessType = BusinessType.QUERY)
    public Result<CourseStatsResponseDTO> getCourseStats(
            @Parameter(description = "Optional admin user ID for specific admin stats") 
            @RequestParam(required = false) Long adminUserId) {
        // Use optimized SQL aggregation query (global if adminUserId is null, specific admin if provided)
        Map<String, Object> stats = subjectService.getCourseStatisticsOptimized(adminUserId);
        
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
     * Convert Subject entities to CourseResponseDTOs with dual-path optimization
     * Uses parallel execution: cache-based vs SQL aggregation, whichever finishes first
     */
    private List<CourseResponseDTO> convertToDTOsWithDualPath(List<Subject> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        // Extract subject IDs
        List<Long> subjectIds = subjects.stream()
                .map(Subject::getSubjectId)
                .collect(Collectors.toList());

        try {
            // Path 1: Cache-based approach (async) - simple and reliable
            CompletableFuture<WinnerResult> cacheBasedFuture = CompletableFuture.supplyAsync(() -> {
                Map<Long, Integer> cacheCountMap = new java.util.HashMap<>();
                for (Long subjectId : subjectIds) {
                    try {
                        Integer count = assignmentService.getAssignmentCountBySubject(subjectId);
                        cacheCountMap.put(subjectId, count);
                    } catch (Exception e) {
                        // Individual error handling - continue with other subjects
                        log.error("Error fetching cached assignment count for subjectId {}: {}", subjectId, e.getMessage());
                        cacheCountMap.put(subjectId, 0);
                    }
                }
                return new WinnerResult("cache", cacheCountMap);
            }).exceptionally(throwable -> {
                // Fallback for the entire cache-based approach
                log.error("Cache-based approach failed: {}", throwable.getMessage());
                Map<Long, Integer> fallbackMap = new java.util.HashMap<>();
                for (Long subjectId : subjectIds) {
                    fallbackMap.put(subjectId, 0);
                }
                return new WinnerResult("cache-fallback", fallbackMap);
            });

            // Path 2: SQL aggregation approach (async)
            CompletableFuture<WinnerResult> sqlBasedFuture = CompletableFuture.supplyAsync(() -> {
                Map<Long, Integer> sqlCountMap = assignmentService.getAssignmentCountsBySubjectIds(subjectIds);
                return new WinnerResult("sql", sqlCountMap);
            }).exceptionally(throwable -> {
                // Handle exceptions in SQL aggregation approach
                log.error("SQL aggregation approach failed: {}", throwable.getMessage());
                Map<Long, Integer> fallbackMap = new java.util.HashMap<>();
                for (Long subjectId : subjectIds) {
                    fallbackMap.put(subjectId, 0);
                }
                return new WinnerResult("sql-fallback", fallbackMap);
            });

            // Race condition: use whichever completes first
            CompletableFuture<Object> winnerFuture = CompletableFuture.anyOf(
                    cacheBasedFuture, sqlBasedFuture
            );

            // Get the result with timeout
            WinnerResult winner = (WinnerResult) winnerFuture.get(3, TimeUnit.SECONDS);
            
            // Log the winner for performance analysis
            log.info("Assignment count dual-path winner: {} for {} subjects", winner.getSource(), subjectIds.size());
            
            Map<Long, Integer> assignmentCountMap = winner.getData();

            // Convert subjects to DTOs using the winning result
            return subjects.stream()
                    .map(subject -> convertToDTOWithCount(subject, assignmentCountMap.getOrDefault(subject.getSubjectId(), 0)))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            // Fallback: use original single-path approach
            log.warn("Dual-path optimization failed, falling back to single-path approach: {}", e.getMessage());
            return subjects.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Convert Subject entity to CourseResponseDTO with pre-computed assignment count
     */
    private CourseResponseDTO convertToDTOWithCount(Subject subject, Integer assignmentCount) {
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
        dto.setAssignments(assignmentCount); // Use pre-computed count
        dto.setCreateTime(subject.getCreateTime());
        dto.setCreator(subject.getCreator());
        dto.setUpdateTime(subject.getUpdateTime());
        dto.setUpdater(subject.getUpdater());
        return dto;
    }

    /**
     * Convert Subject entity to CourseResponseDTO for newly created courses
     * Optimized version that doesn't query assignment count (new courses have 0 assignments)
     */
    private CourseResponseDTO convertToDTOForCreate(Subject subject) {
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
        dto.setAssignments(0); // New courses always have 0 assignments - no DB query needed
        dto.setCreateTime(subject.getCreateTime());
        dto.setCreator(subject.getCreator());
        dto.setUpdateTime(subject.getUpdateTime());
        dto.setUpdater(subject.getUpdater());
        return dto;
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
        
        // Use cached assignment count for better performance
        try {
            Integer assignmentCount = assignmentService.getAssignmentCountBySubject(subject.getSubjectId());
            dto.setAssignments(assignmentCount);
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

    /**
     * Wrapper class to identify the winner of dual-path optimization
     */
    private static class WinnerResult {
        private final String source;
        private final Map<Long, Integer> data;

        public WinnerResult(String source, Map<Long, Integer> data) {
            this.source = source;
            this.data = data;
        }

        public String getSource() {
            return source;
        }

        public Map<Long, Integer> getData() {
            return data;
        }
    }
}
