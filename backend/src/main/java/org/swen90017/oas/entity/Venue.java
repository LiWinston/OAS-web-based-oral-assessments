package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("venue")
public class Venue {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String roomName;

    private Long assignmentId;
}