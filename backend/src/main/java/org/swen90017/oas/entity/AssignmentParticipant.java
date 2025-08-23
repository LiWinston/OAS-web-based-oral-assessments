package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

@Data
public class AssignmentParticipant {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long assignmentId;
    private Long userId;
    private Long roleId;
    private Integer ifJoin;
}
