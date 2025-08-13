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
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SubjectMapper;

import java.util.List;

/**
 * Subject/Course Service (Simplified for Frontend Compatibility)
 * Handles course management with embedded academic period information
 */
@Service
@RequiredArgsConstructor
public class SubjectService extends ServiceImpl<SubjectMapper, Subject> {

    private final SubjectMapper subjectMapper;

    /**
     * Get paginated courses/subjects (matches frontend API expectations)
     */
    public IPage<Subject> getCourses(int pageNum, int pageSize, Integer academicYear, String semester, 
                                    String subjectCode, Long adminUserId, String status) {
        Page<Subject> page = new Page<>(pageNum, pageSize);
        
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        if (academicYear != null) {
            queryWrapper.eq(Subject::getAcademicYear, academicYear);
        }
        if (StringUtils.hasText(semester)) {
            queryWrapper.eq(Subject::getSemester, semester);
        }
        if (StringUtils.hasText(subjectCode)) {
            queryWrapper.like(Subject::getSubjectCode, subjectCode);
        }
        if (adminUserId != null) {
            queryWrapper.eq(Subject::getAdminUserId, adminUserId);
        }
        if (StringUtils.hasText(status)) {
            queryWrapper.eq(Subject::getStatus, status);
        } else {
            queryWrapper.eq(Subject::getIsActive, true);
        }
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

        // Check if subject code already exists for this academic year and semester
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSubjectCode, dto.getSubjectCode())
                   .eq(Subject::getAcademicYear, dto.getAcademicYear())
                   .eq(Subject::getSemester, dto.getSemester());
        
        if (subjectMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.SUBJECT_ALREADY_EXISTS);
        }

        // Validate admin user ID
        if (dto.getAdminUserId() == null || dto.getAdminUserId() <= 0) {
            throw new BusinessException(BusinessError.SUBJECT_ADMIN_INVALID);
        }

        Subject subject = new Subject();
        BeanUtils.copyProperties(dto, subject);
        
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

        // Validate admin user ID
        if (dto.getAdminUserId() == null || dto.getAdminUserId() <= 0) {
            throw new BusinessException(BusinessError.SUBJECT_ADMIN_INVALID);
        }

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
     */
    @Transactional
    public void deleteSubject(Long subjectId) {
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Check if there are any assignments associated with this subject
        // This would be implemented when AssignmentService is created
        
        subject.setIsActive(false);
        subjectMapper.updateById(subject);
    }

    /**
     * Get subject by ID
     */
    public Subject getSubjectById(Long subjectId) {
        Subject subject = subjectMapper.selectById(subjectId);
        if (subject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }
        return subject;
    }
}
