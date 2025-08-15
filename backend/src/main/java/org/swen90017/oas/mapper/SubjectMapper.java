package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.swen90017.oas.entity.Subject;

import java.util.Map;

/**
 * Subject Mapper
 * User Story 4.1: Set up academic periods (year, semester, subject)
 */
@Mapper
public interface SubjectMapper extends BaseMapper<Subject> {

    /**
     * Get course statistics efficiently using SQL aggregation
     * Returns: totalCourses, activeCourses, totalAssignments
     */
    Map<String, Object> getCourseStatistics();

    /**
     * Get the most recent academic year from active courses
     */
    Integer getLatestAcademicYear();
}
