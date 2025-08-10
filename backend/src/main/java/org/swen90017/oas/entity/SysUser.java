package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("sys_user")
public class SysUser {
    @TableId
    private Long userId;
    private String email;
    private String userName;
    private String password;
    //TODO:change to enum
    private String status;
    private Date createTime;
    private Long creator;
    private Date updateTime;
    private Long updater;
}
