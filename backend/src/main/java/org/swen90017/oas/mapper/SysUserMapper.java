package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysUser;
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    
    /**
     * Find user by username
     * 
     * @param userName Username
     * @return User information
     */
    @Select("SELECT * FROM sys_user WHERE user_name = #{userName} LIMIT 1")
    SysUser selectByUserName(@Param("userName") String userName);
}
