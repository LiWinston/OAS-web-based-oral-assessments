package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("sys_user")
public class SysUser {
    @TableId(value = "user_id", type = IdType.AUTO)
    private Long userId;
    private String email;
    private String userName;
    private String password;
    //TODO:change to enum
    private String status;
    // Registration workflow status: 0=INVITED,1=REGISTERED,2=EXPIRED
    private String registrationStatus;
    private Date invitedAt;
    private Date registeredAt;
    private Date createTime;
    private Long creator;
    private Date updateTime;
    private Long updater;
    private Date lastLoginAt;
}
