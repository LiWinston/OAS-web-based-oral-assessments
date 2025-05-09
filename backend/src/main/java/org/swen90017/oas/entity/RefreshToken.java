package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

/**
 * Refresh Token entity
 */
@Data
@TableName("sys_refresh_token")
public class RefreshToken {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * User ID
     */
    private Long userId;
    
    /**
     * Refresh token string
     */
    private String token;
    
    /**
     * Expiry time
     */
    private Date expiryTime;
    
    /**
     * Issued time
     */
    private Date issuedTime;
    
    /**
     * Whether token is revoked
     */
    private Boolean revoked;
    
    /**
     * Check if token is expired using Java 8 date time API
     */
    public boolean isExpired() {
        LocalDateTime expiry = expiryTime.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        return expiry.isBefore(LocalDateTime.now());
    }
} 