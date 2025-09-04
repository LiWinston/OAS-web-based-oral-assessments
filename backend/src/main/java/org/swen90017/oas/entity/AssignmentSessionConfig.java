package org.swen90017.oas.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("assignment_session_config")
public class AssignmentSessionConfig implements Serializable {
    @TableId
    private Long assignmentId;                  // PK = assignment_id

    private Integer sessionLengthMin;          // >0
    private Integer gapTimeMin;                // >=0
    private Integer examinersPerSession;       // >=1
    private Integer defaultMaxSessionsPerExaminer; // 0=不限；>0=启用统一上限

    private Boolean isConfigured;              // tinyint(1)
    private LocalDateTime lastModified;        // ON UPDATE CURRENT_TIMESTAMP
    private Long updatedBy;                    // 操作人（可空）
}