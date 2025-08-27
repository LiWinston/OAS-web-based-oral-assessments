package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("time_slot_examiners")
public class TimeSlotExaminer implements Serializable {

    // MP 对联合主键没有内置注解，这里不标 @TableId，由 Mapper XML 负责 insert/delete
    private Long slotId;
    private Long examinerId;

    private LocalDateTime assignedAt;
    private Long assignedBy;
}