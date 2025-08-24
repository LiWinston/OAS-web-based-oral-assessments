package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.Assignment;

import java.util.List;
import java.util.Map;

/**
 * Assignment Mapper
 * Handles database operations for Assignment entity
 */
@Mapper
public interface AssignmentMapper extends BaseMapper<Assignment> {

    /**
     * Batch get assignment counts by subject IDs using SQL aggregation
     * Returns Map with subjectId as key and count as value
     */
    @Select("SELECT subject_id as subjectId, COUNT(*) as assignmentCount " +
            "FROM assignment " +
            "WHERE subject_id IN " +
            "<foreach collection='subjectIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach> " +
            "GROUP BY subject_id")
    List<Map<String, Object>> selectAssignmentCountsBySubjectIds(@Param("subjectIds") List<Long> subjectIds);
}
