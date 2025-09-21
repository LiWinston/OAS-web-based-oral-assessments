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
@TableName("assessment_submission")
@Schema(description = "Assessment submission entity (single-table JSON design)")
public class AssessmentSubmission implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long assignmentId;
    private Long sessionId; // 可为空
    
    /**
     * Enrollment ID - references session_student.id
     * Links assessment to specific enrollment in session
     */
    @Schema(description = "Enrollment ID from session_student table", example = "1001")
    private Long enrollmentId;

    /**
     * Align with AssignMode: INDIVIDUAL | GROUP
     */
    private String subjectType;
    private Long subjectId;

    private Long examinerId;

    /**
     * DRAFT | SUBMITTED | RETURNED
     */
    private String status;

    private String overallFeedback; // 面向学生/组
    private String adminNote;       // 仅管理员可见

    private Double totalScore;      // 聚合得分

    /**
     * JSON snapshots (stored as TEXT/JSON in DB)
     */
    private String rubricMetaSnapshot;
    private String rubricsInfoSnapshot;
    private String scoresJson;

    private LocalDateTime submittedAt;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private Integer version;
}


