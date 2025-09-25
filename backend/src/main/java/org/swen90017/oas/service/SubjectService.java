package org.swen90017.oas.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.SubjectDto;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.AssignmentService;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Subject/Course Service (Simplified for Frontend Compatibility)
 * Handles course management with embedded academic period information
 */
@Service
@RequiredArgsConstructor
public class SubjectService extends ServiceImpl<SubjectMapper, Subject> {

    private final SubjectMapper subjectMapper;
    private final AssignmentService assignmentService;
    private final SysUserMapper sysUserMapper;

    /**
     * Get paginated courses/subjects (matches frontend API expectations)
     */
    public IPage<Subject> getCourses(int pageNum, int pageSize, Integer academicYear, String semester, 
                                    String subjectCode, Long adminUserId, String status, Boolean isActive) {
        Page<Subject> page = new Page<>(pageNum, pageSize);
        
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        if (academicYear != null) {
            queryWrapper.eq(Subject::getAcademicYear, academicYear);
        }
        if (StringUtils.hasText(semester)) {
            queryWrapper.eq(Subject::getSemester, semester);
        }
        if (StringUtils.hasText(subjectCode)) {
            // Fuzzy search on course code, course name, and description
            // Also support search by admin's name
            queryWrapper.and(wrapper -> wrapper
                .like(Subject::getSubjectCode, subjectCode)
                .or()
                .like(Subject::getSubjectName, subjectCode)  
                .or()
                .like(Subject::getDescription, subjectCode)
                .or()
                // Search by admin's name: use EXISTS subquery
                .exists("SELECT 1 FROM sys_user su WHERE su.user_id = subject.admin_user_id AND su.user_name LIKE '%" + subjectCode + "%'")
            );
        }
        if (adminUserId != null) {
            queryWrapper.eq(Subject::getAdminUserId, adminUserId);
        }
        if (StringUtils.hasText(status)) {
            queryWrapper.eq(Subject::getStatus, status);
        }
        // isActive filter logic: null=no filter (all), true=only active, false=only inactive
        if (isActive != null) {
            queryWrapper.eq(Subject::getIsActive, isActive);
        }
        // When isActive is null, do not add filter; SuperAdmin can view all course statuses
        queryWrapper.orderByDesc(Subject::getAcademicYear)
                   .orderByAsc(Subject::getSemester)
                   .orderByAsc(Subject::getSubjectCode);

        return subjectMapper.selectPage(page, queryWrapper);
    }

    /**
     * Get courses by academic year and semester
     */
    public List<Subject> getCoursesByPeriod(Integer academicYear, String semester) {
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getAcademicYear, academicYear)
                   .eq(Subject::getSemester, semester)
                   .eq(Subject::getIsActive, true)
                   .orderByAsc(Subject::getSubjectCode);
        return subjectMapper.selectList(queryWrapper);
    }

    /**
     * Get subjects by admin user
     */
    public List<Subject> getSubjectsByAdmin(Long adminUserId) {
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getAdminUserId, adminUserId)
                   .eq(Subject::getIsActive, true)
                   .orderByAsc(Subject::getSubjectCode);
        return subjectMapper.selectList(queryWrapper);
    }

    /**
     * Get all active subjects
     */
    public List<Subject> getActiveSubjects() {
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getIsActive, true)
                   .orderByAsc(Subject::getSubjectCode);
        return subjectMapper.selectList(queryWrapper);
    }

    /**
     * Create course/subject (simplified business logic)
     */
    @Transactional
    public Subject createCourse(SubjectDto dto) {
        // Validate academic year
        if (dto.getAcademicYear() == null || dto.getAcademicYear() < 2020 || dto.getAcademicYear() > 2030) {
            throw new BusinessException(BusinessError.SUBJECT_INVALID_YEAR);
        }

        // Validate semester
        if (!isValidSemester(dto.getSemester())) {
            throw new BusinessException(BusinessError.SUBJECT_INVALID_SEMESTER);
        }

        // Fast dual validation: admin user first (likely to be cached), then subject existence
        validateAdminUser(dto.getAdminUserId());
        
        // Check if subject code already exists for this academic year and semester
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSubjectCode, dto.getSubjectCode())
                   .eq(Subject::getAcademicYear, dto.getAcademicYear())
                   .eq(Subject::getSemester, dto.getSemester());
        
        if (subjectMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.SUBJECT_ALREADY_EXISTS);
        }

        Subject subject = new Subject();
        BeanUtils.copyProperties(dto, subject);
        
        // Set default status and isActive
        subject.setIsActive(true);
        subject.setStatus("active");
        
        subjectMapper.insert(subject);
        return subject;
    }

    /**
     * Update course/subject (simplified business logic)
     */
    @Transactional
    public Subject updateCourse(Long subjectId, SubjectDto dto) {
        Subject existingSubject = subjectMapper.selectById(subjectId);
        if (existingSubject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Validate academic year
        if (dto.getAcademicYear() == null || dto.getAcademicYear() < 2020 || dto.getAcademicYear() > 2030) {
            throw new BusinessException(BusinessError.SUBJECT_INVALID_YEAR);
        }

        // Validate semester
        if (!isValidSemester(dto.getSemester())) {
            throw new BusinessException(BusinessError.SUBJECT_INVALID_SEMESTER);
        }

        // Check if subject code already exists for this academic year and semester (excluding current record)
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSubjectCode, dto.getSubjectCode())
                   .eq(Subject::getAcademicYear, dto.getAcademicYear())
                   .eq(Subject::getSemester, dto.getSemester())
                   .ne(Subject::getSubjectId, subjectId);
        
        if (subjectMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.SUBJECT_ALREADY_EXISTS);
        }

        // Validate admin user ID - check existence and admin privileges
        validateAdminUser(dto.getAdminUserId());

        BeanUtils.copyProperties(dto, existingSubject, "subjectId", "createTime", "creator");
        subjectMapper.updateById(existingSubject);
        return existingSubject;
    }

    /**
     * Validate semester string
     */
    private boolean isValidSemester(String semester) {
        if (!StringUtils.hasText(semester)) {
            return false;
        }
        return "1".equals(semester) || "2".equals(semester) || "summer".equals(semester);
    }



    /**
     * Delete subject (logical delete by setting isActive to false)
     * Cascades delete to all associated assignments
     */
    @Transactional
    public void deleteSubject(Long subjectId) {
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null || !subject.getIsActive()) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Cascade delete: remove all associated assignments first
        List<AssignmentResponseDTO> assignments = assignmentService.getAssignmentsBySubject(subjectId);
        for (AssignmentResponseDTO assignment : assignments) {
            assignmentService.deleteAssignment(assignment.getId());
        }
        
        // Then delete the subject - set both isActive and status
        subject.setIsActive(false);
        subject.setStatus("archived");
        subjectMapper.updateById(subject);
    }

    /**
     * Get course statistics efficiently using SQL aggregation for specific admin
     * This method uses a single optimized query instead of N+1 queries
     */
    public Map<String, Object> getCourseStatisticsOptimized(Long adminUserId) {
        Map<String, Object> stats = subjectMapper.getCourseStatistics(adminUserId);
        
        // Convert Long to Integer for consistency with frontend expectations
        if (stats.get("totalCourses") != null) {
            stats.put("totalCourses", ((Number) stats.get("totalCourses")).intValue());
        }
        if (stats.get("activeCourses") != null) {
            stats.put("activeCourses", ((Number) stats.get("activeCourses")).intValue());
        }
        if (stats.get("totalAssignments") != null) {
            stats.put("totalAssignments", ((Number) stats.get("totalAssignments")).intValue());
        }
        
        return stats;
    }

    /**
     * Get the most recent academic year from active courses
     */
    public Integer getLatestAcademicYear() {
        Integer year = subjectMapper.getLatestAcademicYear();
        return year != null ? year : java.time.LocalDate.now().getYear();
    }

    /**
     * Get subject by ID (only returns active subjects)
     */
    public Subject getSubjectById(Long subjectId) {
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null || !subject.getIsActive()) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }
        return subject;
    }

    /**
     * Get subject by ID including inactive subjects (for admin purposes)
     */
    public Subject getSubjectByIdIncludeInactive(Long subjectId) {
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }
        return subject;
    }

    /**
     * Validate that the user ID exists and has admin privileges
     * Uses a single SQL query for efficient validation
     * 
     * @param userId User ID to validate
     * @throws BusinessException if user doesn't exist or lacks admin privileges
     */
    private void validateAdminUser(Long userId) {
        if (userId == null) {
            throw new BusinessException(BusinessError.SUBJECT_ADMIN_INVALID);
        }
        
        // Use single SQL query to check existence and roles
        List<String> adminRoles = Arrays.asList(UserRole.ADMIN.code(), UserRole.SUPER_ADMIN.code());
        boolean isValidAdmin = sysUserMapper.existsUserWithRoles(userId, adminRoles);
        
        if (!isValidAdmin) {
            throw new BusinessException(BusinessError.SUBJECT_ADMIN_INVALID);
        }
    }
}
