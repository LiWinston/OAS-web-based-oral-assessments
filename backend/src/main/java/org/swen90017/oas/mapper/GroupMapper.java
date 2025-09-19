package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysGroup;
@Mapper
public interface GroupMapper extends BaseMapper<SysGroup> {
    @Select("SELECT * FROM sys_group WHERE canvas_group_id = #{canvasGroupId}")
    SysGroup selectByCanvasGroupId(@Param("canvasGroupId") String canvasGroupId);
    
    @Select("SELECT g.* FROM sys_group g " +
            "INNER JOIN sys_student_group sg ON g.group_id = sg.group_id " +
            "WHERE sg.user_id = #{studentId} AND g.assignment_id = #{assignmentId}")
    SysGroup selectByStudentIdAndAssignmentId(@Param("studentId") Long studentId, @Param("assignmentId") Long assignmentId);
}
