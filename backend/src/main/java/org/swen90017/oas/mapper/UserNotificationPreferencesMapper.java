package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.UserNotificationPreferences;

@Mapper
public interface UserNotificationPreferencesMapper extends BaseMapper<UserNotificationPreferences> {
    @Update("UPDATE user_notification_preferences SET email_enabled = #{prefs.emailEnabled}, desktop_enabled = #{prefs.desktopEnabled}, booking_updates = #{prefs.bookingUpdates}, examiner_updates = #{prefs.examinerUpdates}, assignment_updates = #{prefs.assignmentUpdates}, result_updates = #{prefs.resultUpdates}, group_updates = #{prefs.groupUpdates}, system_alerts = #{prefs.systemAlerts}, updated_at = NOW() WHERE user_id = #{userId}")
    int updatePreferences(@Param("userId") Long userId, @Param("prefs") UserNotificationPreferences prefs);
}
