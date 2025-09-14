package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.enums.AssignMode;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("slot_sessions")
public class SlotSession implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long sessionId;

    private Long assignmentId;
    private Long slotId;
    private Integer sessionNumber;             // 从1开始

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private SessionStatus status;              // available/blocked/booked
    // 新增字段以支持会话级容量与发布/指派等（已落库）
    private Long venueId;                       // 会话级场地，可空
    private Integer capacityGroups;             // 组容量
    private Integer enrolledGroups;             // 已报名的组数
    private Integer requiredExaminers;          // 需要考官数
    private AssignMode assignMode;              // INDIVIDUAL / GROUP
    private Boolean isPublishedToExaminer;      // 对考官是否发布
    private Boolean isPublishedToStudent;       // 对学生是否发布
    private Boolean isStaffed;                  // 是否已配员（存在至少一位考官）

    private Long bookedSubjectId;                     // 学生/小组 id
    private String bookedSubjectType;               // "student" or "group"
    private LocalDateTime bookedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}