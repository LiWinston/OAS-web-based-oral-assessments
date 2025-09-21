package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_profile")
public class UserProfile {
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;
    private String fullName;
    private String department;
    private String phone;
    private String timezone;
    private String language;
    private Integer completeness;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
