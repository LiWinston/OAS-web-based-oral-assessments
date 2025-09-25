package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("time_slot_examiners")
public class TimeSlotExaminer implements Serializable {

    // MyBatis-Plus has no built-in composite key annotation; omit @TableId here and delegate insert/delete to Mapper XML
    private Long slotId;
    private Long examinerId;

    private LocalDateTime assignedAt;
    private Long assignedBy;
}