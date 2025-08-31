package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;

@Mapper
public interface ExaminerAssignmentLimitMapper extends BaseMapper<ExaminerAssignmentLimit> {

    @Select("SELECT * FROM examiner_assignment_limit WHERE examiner_id = #{examinerId} AND assignment_id = #{assignmentId} LIMIT 1")
    ExaminerAssignmentLimit findByExaminerAndAssignment(@Param("examinerId") Long examinerId,
                                                        @Param("assignmentId") Long assignmentId);

    int updateMaxSessionsByPair(@Param("examinerId") Long examinerId,
                                @Param("assignmentId") Long assignmentId,
                                @Param("maxSessions") Integer maxSessions);
}


