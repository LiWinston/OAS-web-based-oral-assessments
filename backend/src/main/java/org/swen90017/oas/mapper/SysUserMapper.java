package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysUser;

import java.util.List;

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

    void batchInsert(@Param("list") List<SysUser> users);

    @Select("SELECT u.* FROM sys_user u JOIN sys_user_role ur ON u.user_id = ur.user_id JOIN sys_role r ON ur.role_id = r.role_id WHERE r.role_key = #{roleKey}")
    List<SysUser> selectByRoleKey(@Param("roleKey") String roleKey);

}
