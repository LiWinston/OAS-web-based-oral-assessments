package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_notification_preferences")
public class UserNotificationPreferences {
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;
    private Boolean emailEnabled;
    private Boolean desktopEnabled;
    private Boolean bookingUpdates;
    private Boolean examinerUpdates;
    private Boolean assignmentUpdates;
    private Boolean resultUpdates;
    private Boolean groupUpdates;
    private Boolean systemAlerts;
    private LocalDateTime updatedAt;
}
