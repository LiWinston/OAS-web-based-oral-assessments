package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.swen90017.oas.entity.PasswordResetCode;

@Mapper
public interface PasswordResetCodeMapper extends BaseMapper<PasswordResetCode> {

    @Select("SELECT * FROM password_reset_codes WHERE user_id = #{userId} AND used_at IS NULL ORDER BY created_at DESC LIMIT 1")
    PasswordResetCode findLatestActiveByUserId(@Param("userId") Long userId);

    @Update("UPDATE password_reset_codes SET used_at = NOW() WHERE id = #{id} AND used_at IS NULL")
    int markUsed(@Param("id") Long id);
}


