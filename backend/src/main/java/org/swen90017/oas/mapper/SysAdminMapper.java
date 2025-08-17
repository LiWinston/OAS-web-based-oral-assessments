package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysAdmin;

@Mapper
public interface SysAdminMapper extends BaseMapper<SysAdmin> {

    @Select("SELECT * FROM sys_admin WHERE user_id = #{userId} LIMIT 1")
    SysAdmin selectByUserId(@Param("userId") Long userId);
}


