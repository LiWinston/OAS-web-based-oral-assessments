package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;
import org.swen90017.oas.entity.EmailNotification;

@Mapper
public interface EmailNotificationMapper extends BaseMapper<EmailNotification> {

    @Update("UPDATE email_notification_queue SET status=#{newStatus}, updated_at=NOW() WHERE id=#{id} AND status=#{expectStatus}")
    int claim(@Param("id") Long id,
              @Param("expectStatus") String expectStatus,
              @Param("newStatus") String newStatus);
}
