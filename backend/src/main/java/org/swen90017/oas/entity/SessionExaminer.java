package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("session_examiners")
public class SessionExaminer implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;                 // Optional auto-increment; can be omitted if DB uses composite key
    private Long sessionId;
    private Long examinerId;
    private LocalDateTime assignedAt;
    private Long assignedBy;
}


