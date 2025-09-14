package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("session_examiners")
public class SessionExaminer implements Serializable {
    @TableId
    private Long id;                 // 可选自增，若数据库使用复合主键也可省略
    private Long sessionId;
    private Long examinerId;
    private LocalDateTime assignedAt;
    private Long assignedBy;
}


