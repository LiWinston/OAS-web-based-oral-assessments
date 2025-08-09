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
import org.swen90017.oas.dto.AcademicYearDto;
import org.swen90017.oas.entity.AcademicYear;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AcademicYearMapper;

import java.util.List;

/**
 * Academic Year Service
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Service
@RequiredArgsConstructor
public class AcademicYearService extends ServiceImpl<AcademicYearMapper, AcademicYear> {

    private final AcademicYearMapper academicYearMapper;

    /**
     * Get paginated academic years
     */
    public IPage<AcademicYear> getAcademicYears(int pageNum, int pageSize, String yearValue, Boolean isActive) {
        Page<AcademicYear> page = new Page<>(pageNum, pageSize);
        
        LambdaQueryWrapper<AcademicYear> queryWrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(yearValue)) {
            queryWrapper.like(AcademicYear::getYearValue, yearValue);
        }
        if (isActive != null) {
            queryWrapper.eq(AcademicYear::getIsActive, isActive);
        }
        queryWrapper.orderByDesc(AcademicYear::getYearValue);

        return academicYearMapper.selectPage(page, queryWrapper);
    }

    /**
     * Get all active academic years
     */
    public List<AcademicYear> getActiveAcademicYears() {
        LambdaQueryWrapper<AcademicYear> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AcademicYear::getIsActive, true)
                   .orderByDesc(AcademicYear::getYearValue);
        return academicYearMapper.selectList(queryWrapper);
    }

    /**
     * Create academic year
     */
    @Transactional
    public AcademicYear createAcademicYear(AcademicYearDto dto) {
        // Check if year value already exists
        LambdaQueryWrapper<AcademicYear> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AcademicYear::getYearValue, dto.getYearValue());
        
        if (academicYearMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_ALREADY_EXISTS);
        }

        // Validate date range
        if (!dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_DATE_INVALID);
        }

        AcademicYear academicYear = new AcademicYear();
        BeanUtils.copyProperties(dto, academicYear);
        
        academicYearMapper.insert(academicYear);
        return academicYear;
    }

    /**
     * Update academic year
     */
    @Transactional
    public AcademicYear updateAcademicYear(Long yearId, AcademicYearDto dto) {
        AcademicYear existingYear = academicYearMapper.selectById(yearId);
        if (existingYear == null) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_NOT_FOUND);
        }

        // Check if year value already exists (excluding current record)
        LambdaQueryWrapper<AcademicYear> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AcademicYear::getYearValue, dto.getYearValue())
                   .ne(AcademicYear::getYearId, yearId);
        
        if (academicYearMapper.selectCount(queryWrapper) > 0) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_ALREADY_EXISTS);
        }

        // Validate date range
        if (!dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_DATE_INVALID);
        }

        BeanUtils.copyProperties(dto, existingYear, "yearId", "createTime", "creator");
        academicYearMapper.updateById(existingYear);
        return existingYear;
    }

    /**
     * Delete academic year (logical delete by setting isActive to false)
     */
    @Transactional
    public void deleteAcademicYear(Long yearId) {
        AcademicYear academicYear = academicYearMapper.selectById(yearId);
        if (academicYear == null) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_NOT_FOUND);
        }

        // Check if there are any semesters associated with this academic year
        // This would be implemented when SemesterService is created
        
        academicYear.setIsActive(false);
        academicYearMapper.updateById(academicYear);
    }

    /**
     * Get academic year by ID
     */
    public AcademicYear getAcademicYearById(Long yearId) {
        AcademicYear academicYear = academicYearMapper.selectById(yearId);
        if (academicYear == null) {
            throw new BusinessException(BusinessError.ACADEMIC_YEAR_NOT_FOUND);
        }
        return academicYear;
    }
}
