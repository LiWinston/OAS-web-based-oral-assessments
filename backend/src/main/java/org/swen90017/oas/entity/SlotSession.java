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
    private Integer sessionNumber;             // Starts from 1

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private SessionStatus status;              // available/blocked/booked
    // Additional fields to support session-level capacity and publish/assignment (persisted)
    private Long venueId;                       // Session-level venue, nullable
    private Integer capacityGroups;             // Group capacity
    private Integer enrolledGroups;             // Number of enrolled groups
    private Integer requiredExaminers;          // Required number of examiners
    private AssignMode assignMode;              // INDIVIDUAL / GROUP
    private Boolean isPublishedToExaminer;      // Published to examiners
    private Boolean isPublishedToStudent;       // Published to students
    private Boolean isStaffed;                  // Staffed (at least one examiner exists)

    private Long bookedSubjectId;                     // Student/group id
    private String bookedSubjectType;               // "student" or "group"
    private LocalDateTime bookedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}