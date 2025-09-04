package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.AssignmentParticipant;

import java.util.List;

@Mapper
public interface AssignmentParticipantMapper extends BaseMapper<AssignmentParticipant> {

    List<Long> listExaminerUserIdsByAssignment(@Param("assignmentId") Long assignmentId);

    int countParticipantsByRoleAndJoin(@Param("assignmentId") Long assignmentId,
                                       @Param("roleId") Long roleId);
}
