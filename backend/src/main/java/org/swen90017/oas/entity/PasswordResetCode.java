package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

/**
 * Password reset one-time code entity
 */
@Data
@TableName("password_reset_codes")
public class PasswordResetCode {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("code_hash")
    private String codeHash;

    @TableField("expires_at")
    private Date expiresAt;

    @TableField("used_at")
    private Date usedAt;

    @TableField("attempt_count")
    private Integer attemptCount;

    @TableField("created_at")
    private Date createdAt;

    @TableField("last_sent_at")
    private Date lastSentAt;

    @TableField("created_ip")
    private String createdIp;

    @TableField("user_agent")
    private String userAgent;
}


