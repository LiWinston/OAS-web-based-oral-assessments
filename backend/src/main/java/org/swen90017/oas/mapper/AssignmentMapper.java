package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.Assignment;

import java.time.LocalDateTime;
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
    List<Map<String, Object>> selectAssignmentCountsBySubjectIds(@Param("subjectIds") List<Long> subjectIds);

    String getScheduleStatus(@Param("assignmentId") Long assignmentId);

    Boolean isReleased(@Param("assignmentId") Long assignmentId);

    int updateRelease(@Param("assignmentId") Long assignmentId,
                      @Param("status") String status,
                      @Param("released") boolean released,
                      @Param("releasedAt") LocalDateTime releasedAt);
}
