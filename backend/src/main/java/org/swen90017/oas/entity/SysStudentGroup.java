package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("sys_student_group")
public class SysStudentGroup {
    @TableId(value = "user_id", type = IdType.INPUT)
    private Long userId;
    private Long groupId;

    public SysStudentGroup(Long userId, Long groupId) {
        this.userId = userId;
        this.groupId = groupId;
    }
}
