package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import org.swen90017.oas.enums.SessionStatus;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("slot_sessions")
public class SlotSession implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long sessionId;

    private Long slotId;
    private Integer sessionNumber;             // 从1开始

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private SessionStatus status;              // available/blocked/booked
    private Long bookedSubjectId;                     // 学生/小组 id
    private String bookedSubjectType;               // "student" or "group"
    private LocalDateTime bookedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}