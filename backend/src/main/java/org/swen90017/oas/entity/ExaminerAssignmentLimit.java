package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("examiner_assignment_limit")
public class ExaminerAssignmentLimit {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long examinerId;

    private Long assignmentId;

    private Integer maxSessions;
}


