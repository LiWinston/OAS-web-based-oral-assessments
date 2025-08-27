package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import lombok.Data;
import org.swen90017.oas.enums.SlotStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("time_slots")
@Data
public class TimeSlot {
    @TableId(type = IdType.AUTO) private Long slotId;
    private Long assignmentId;
    private LocalDate slotDate;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String venue;
    private Integer sessionCount;
    private Integer requiredExaminers;
    private SlotStatus status; // draft/empty/partial/full/closed
    private Integer currentExaminers;
    private Integer bookedSessions;
    private Boolean bookingOpen;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Version
    private Integer version;
}
