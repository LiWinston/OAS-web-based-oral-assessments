package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@TableName("sys_student")
public class SysStudent{
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;
    private String token;
    private String studentNumber;
    private String sisUserId;
}
