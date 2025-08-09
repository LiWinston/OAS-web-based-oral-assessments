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
import org.swen90017.oas.entity.Semester;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SubjectMapper;

import java.util.List;

/**
 * Subject Service
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Service
@RequiredArgsConstructor
public class SubjectService extends ServiceImpl<SubjectMapper, Subject> {

    private final SubjectMapper subjectMapper;
    private final SemesterService semesterService;

    /**
     * Get paginated subjects
     */
    public IPage<Subject> getSubjects(int pageNum, int pageSize, Long semesterId, String subjectCode, 
                                     Long adminUserId, Boolean isActive) {
        Page<Subject> page = new Page<>(pageNum, pageSize);
        
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        if (semesterId != null) {
            queryWrapper.eq(Subject::getSemesterId, semesterId);
        }
        if (StringUtils.hasText(subjectCode)) {
            queryWrapper.like(Subject::getSubjectCode, subjectCode);
        }
        if (adminUserId != null) {
            queryWrapper.eq(Subject::getAdminUserId, adminUserId);
        }
        if (isActive != null) {
            queryWrapper.eq(Subject::getIsActive, isActive);
        }
        queryWrapper.orderByAsc(Subject::getSubjectCode);

        return subjectMapper.selectPage(page, queryWrapper);
    }

    /**
     * Get subjects by semester
     */
    public List<Subject> getSubjectsBySemester(Long semesterId) {
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSemesterId, semesterId)
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
     * Create subject
     */
    @Transactional
    public Subject createSubject(SubjectDto dto) {
        // Validate semester exists
        Semester semester = semesterService.getSemesterById(dto.getSemesterId());
        if (!semester.getIsActive()) {
            throw new BusinessException(BusinessError.SEMESTER_NOT_FOUND);
        }

        // Check if subject code already exists for this semester
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSemesterId, dto.getSemesterId())
                   .eq(Subject::getSubjectCode, dto.getSubjectCode());
        
        if (subjectMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.SUBJECT_ALREADY_EXISTS);
        }

        // Validate admin user ID
        // In a real implementation, you would validate that the admin user exists and has admin role
        if (dto.getAdminUserId() == null || dto.getAdminUserId() <= 0) {
            throw new BusinessException(BusinessError.SUBJECT_ADMIN_INVALID);
        }

        Subject subject = new Subject();
        BeanUtils.copyProperties(dto, subject);
        
        subjectMapper.insert(subject);
        return subject;
    }

    /**
     * Update subject
     */
    @Transactional
    public Subject updateSubject(Long subjectId, SubjectDto dto) {
        Subject existingSubject = subjectMapper.selectById(subjectId);
        if (existingSubject == null) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }

        // Validate semester exists
        Semester semester = semesterService.getSemesterById(dto.getSemesterId());

        // Check if subject code already exists for this semester (excluding current record)
        LambdaQueryWrapper<Subject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Subject::getSemesterId, dto.getSemesterId())
                   .eq(Subject::getSubjectCode, dto.getSubjectCode())
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
