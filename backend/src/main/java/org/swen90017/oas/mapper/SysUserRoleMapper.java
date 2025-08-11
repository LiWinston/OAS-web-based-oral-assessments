package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysUserRole;

import java.util.List;

@Mapper
public interface SysUserRoleMapper extends BaseMapper<SysUserRole> {
    
    /**
     * Find user role by user ID
     * 
     * @param userId User ID
     * @return User role information
     */
    @Select("SELECT * FROM sys_user_role WHERE user_id = #{userId} LIMIT 1")
    SysUserRole selectByUserId(@Param("userId") Long userId);

    void batchInsert(@Param("list") List<SysUserRole> roleList);

} 