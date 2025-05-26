package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.Data;

import java.time.LocalDateTime;
@Data
public class SysGroup {
    @TableId(type = IdType.AUTO)
    private Long groupId;
    private String groupName;
    private String canvasGroupId;
    private LocalDateTime createTime;
    private Long creator;
}
