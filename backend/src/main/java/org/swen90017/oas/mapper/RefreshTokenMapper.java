package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.swen90017.oas.entity.RefreshToken;

@Mapper
public interface RefreshTokenMapper extends BaseMapper<RefreshToken> {
    
    /**
     * Find refresh token by token string
     * 
     * @param token Token string
     * @return Refresh token entity
     */
    @Select("SELECT * FROM sys_refresh_token WHERE token = #{token} AND revoked = FALSE")
    RefreshToken findByToken(@Param("token") String token);
    
    /**
     * Find active refresh token by user ID
     * 
     * @param userId User ID
     * @return Refresh token entity
     */
    @Select("SELECT * FROM sys_refresh_token WHERE user_id = #{userId} AND revoked = FALSE AND expiry_time > NOW() ORDER BY expiry_time DESC LIMIT 1")
    RefreshToken findActiveByUserId(@Param("userId") Long userId);
    
    /**
     * Revoke all tokens for a user
     * 
     * @param userId User ID
     * @return Number of affected rows
     */
    @Update("UPDATE sys_refresh_token SET revoked = TRUE WHERE user_id = #{userId} AND revoked = FALSE")
    int revokeAllByUserId(@Param("userId") Long userId);
} 