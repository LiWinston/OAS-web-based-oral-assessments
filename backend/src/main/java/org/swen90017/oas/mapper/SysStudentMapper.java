package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysStudent;

import java.util.List;

@Mapper
public interface SysStudentMapper extends BaseMapper<SysStudent> {
    @Select("SELECT u.user_id, u.user_name, u.password, u.status, u.create_time, u.creator, u.update_time, u.updater, " +
            "s.token, s.activated, s.student_number " +
            "FROM sys_user u " +
            "JOIN sys_student s ON u.user_id = s.user_id " +
            "WHERE s.student_number = #{studentNumber}")
    SysStudent selectByStudentNumber(@Param("studentNumber") String studentNumber);

    void batchInsert(@Param("list") List<SysStudent> sysStudents);

}
