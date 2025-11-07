package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("email_notification_queue")
public class EmailNotification {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;         // SCHEDULE_RELEASE_STUDENT / SCHEDULE_RELEASE_EXAMINER
    private Long toUserId;       // optional
    private String toEmail;      // optional

    @TableField("payload_json")
    private String payloadJson;  // JSON string payload

    private String status;       // PENDING | PROCESSING | SENT | FAILED
    private Integer attempts;
    private String lastError;

    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;

    private String dedupKey;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
