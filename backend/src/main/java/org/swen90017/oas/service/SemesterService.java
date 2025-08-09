package org.swen90017.oas.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.dto.SemesterDto;
import org.swen90017.oas.entity.AcademicYear;
import org.swen90017.oas.entity.Semester;
import org.swen90017.oas.mapper.SemesterMapper;

import java.util.List;

/**
 * Semester Service
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Service
@RequiredArgsConstructor
public class SemesterService extends ServiceImpl<SemesterMapper, Semester> {

    private final SemesterMapper semesterMapper;
    private final AcademicYearService academicYearService;

    /**
     * Get paginated semesters
     */
    public IPage<Semester> getSemesters(int pageNum, int pageSize, Long academicYearId, Boolean isActive) {
        Page<Semester> page = new Page<>(pageNum, pageSize);
        
        LambdaQueryWrapper<Semester> queryWrapper = new LambdaQueryWrapper<>();
        if (academicYearId != null) {
            queryWrapper.eq(Semester::getAcademicYearId, academicYearId);
        }
        if (isActive != null) {
            queryWrapper.eq(Semester::getIsActive, isActive);
        }
        queryWrapper.orderByAsc(Semester::getStartDate);

        return semesterMapper.selectPage(page, queryWrapper);
    }

    /**
     * Get semesters by academic year
     */
    public List<Semester> getSemestersByAcademicYear(Long academicYearId) {
        LambdaQueryWrapper<Semester> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Semester::getAcademicYearId, academicYearId)
                   .eq(Semester::getIsActive, true)
                   .orderByAsc(Semester::getStartDate);
        return semesterMapper.selectList(queryWrapper);
    }

    /**
     * Get all active semesters
     */
    public List<Semester> getActiveSemesters() {
        LambdaQueryWrapper<Semester> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Semester::getIsActive, true)
                   .orderByDesc(Semester::getStartDate);
        return semesterMapper.selectList(queryWrapper);
    }

    /**
     * Create semester
     */
    @Transactional
    public Semester createSemester(SemesterDto dto) {
        // Validate academic year exists
        AcademicYear academicYear = academicYearService.getAcademicYearById(dto.getAcademicYearId());
        if (!academicYear.getIsActive()) {
            throw new RuntimeException("Cannot create semester for inactive academic year");
        }

        // Check if semester code already exists for this academic year
        LambdaQueryWrapper<Semester> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Semester::getAcademicYearId, dto.getAcademicYearId())
                   .eq(Semester::getSemesterCode, dto.getSemesterCode());
        
        if (semesterMapper.selectCount(queryWrapper) > 0) {
            throw new RuntimeException("Semester " + dto.getSemesterCode() + " already exists for this academic year");
        }

        // Validate date range
        if (!dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        // Validate semester dates are within academic year dates
        if (dto.getStartDate().isBefore(academicYear.getStartDate()) || 
            dto.getEndDate().isAfter(academicYear.getEndDate())) {
            throw new RuntimeException("Semester dates must be within academic year range");
        }

        Semester semester = new Semester();
        BeanUtils.copyProperties(dto, semester);
        
        semesterMapper.insert(semester);
        return semester;
    }

    /**
     * Update semester
     */
    @Transactional
    public Semester updateSemester(Long semesterId, SemesterDto dto) {
        Semester existingSemester = semesterMapper.selectById(semesterId);
        if (existingSemester == null) {
            throw new RuntimeException("Semester not found with ID: " + semesterId);
        }

        // Validate academic year exists
        AcademicYear academicYear = academicYearService.getAcademicYearById(dto.getAcademicYearId());

        // Check if semester code already exists for this academic year (excluding current record)
        LambdaQueryWrapper<Semester> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Semester::getAcademicYearId, dto.getAcademicYearId())
                   .eq(Semester::getSemesterCode, dto.getSemesterCode())
                   .ne(Semester::getSemesterId, semesterId);
        
        if (semesterMapper.selectCount(queryWrapper) > 0) {
            throw new RuntimeException("Semester " + dto.getSemesterCode() + " already exists for this academic year");
        }

        // Validate date range
        if (!dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }

        // Validate semester dates are within academic year dates
        if (dto.getStartDate().isBefore(academicYear.getStartDate()) || 
            dto.getEndDate().isAfter(academicYear.getEndDate())) {
            throw new RuntimeException("Semester dates must be within academic year range");
        }

        BeanUtils.copyProperties(dto, existingSemester, "semesterId", "createTime", "creator");
        semesterMapper.updateById(existingSemester);
        return existingSemester;
    }

    /**
     * Delete semester (logical delete by setting isActive to false)
     */
    @Transactional
    public void deleteSemester(Long semesterId) {
        Semester semester = semesterMapper.selectById(semesterId);
        if (semester == null) {
            throw new RuntimeException("Semester not found with ID: " + semesterId);
        }

        // Check if there are any subjects associated with this semester
        // This would be implemented when SubjectService is created
        
        semester.setIsActive(false);
        semesterMapper.updateById(semester);
    }

    /**
     * Get semester by ID
     */
    public Semester getSemesterById(Long semesterId) {
        Semester semester = semesterMapper.selectById(semesterId);
        if (semester == null) {
            throw new RuntimeException("Semester not found with ID: " + semesterId);
        }
        return semester;
    }
}
