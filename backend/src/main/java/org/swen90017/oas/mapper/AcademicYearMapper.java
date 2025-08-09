package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.swen90017.oas.entity.AcademicYear;

/**
 * Academic Year Mapper
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Mapper
public interface AcademicYearMapper extends BaseMapper<AcademicYear> {
}
