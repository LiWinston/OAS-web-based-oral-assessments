package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("session_student")
@Schema(description = "Session student booking entity")
public class SessionStudent implements Serializable {

    @TableId(type = IdType.AUTO)
    @Schema(description = "Primary key ID", example = "1")
    private Long id;

    @Schema(description = "Session ID", example = "101")
    private Long sessionId;

    /**
     * Booking type: STUDENT | GROUP
     */
    @Schema(description = "Booking type", example = "STUDENT", allowableValues = {"STUDENT", "GROUP"})
    private String type;

    @Schema(description = "User ID (for STUDENT type) or Group ID (for GROUP type)", example = "1001")
    private Long subjectId;

    @Schema(description = "Booking time", example = "2024-01-15T10:30:00")
    @TableField(value = "booked_time", fill = FieldFill.INSERT)
    private LocalDateTime bookedTime;

    @Schema(description = "Create time", example = "2024-01-15T10:30:00")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @Schema(description = "Update time", example = "2024-01-20T14:45:00")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
