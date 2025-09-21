package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;
import org.swen90017.oas.entity.UserProfile;

@Mapper
public interface UserProfileMapper extends BaseMapper<UserProfile> {
    @Update("UPDATE user_profile SET completeness = #{completeness}, updated_at = NOW() WHERE user_id = #{userId}")
    int updateCompleteness(@Param("userId") Long userId, @Param("completeness") int completeness);
}
