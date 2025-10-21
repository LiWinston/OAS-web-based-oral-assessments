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
    private Long sessionId; // Nullable
    
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
    
    /**
     * Release status: NOT_RELEASED | RELEASED
     * Separate from status to control whether results are visible to students
     */
    @Schema(description = "Release status for student visibility", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
    private String releaseStatus;

    /**
     * Release mode controls which parts of the marking are visible to students once released.
     * FULL (default) exposes rubric comments; SCORES_ONLY hides per-criterion comments.
     */
    @Schema(description = "Release mode controlling student visibility", example = "FULL", allowableValues = {"FULL", "SCORES_ONLY"})
    private String releaseMode;

    private String overallFeedback; // Visible to student/group
    private String adminNote;       // Visible to admin only

    private Double totalScore;      // Aggregated score

    /**
     * Final score override fields
     */
    @Schema(description = "Final score override percentage (0-100)", example = "85.5")
    private Double finalScoreOverride;
    
    @Schema(description = "Reason for score override", example = "Adjusted due to technical difficulties during assessment")
    private String overrideReason;
    
    @Schema(description = "User ID who made the override", example = "1001")
    private Long overrideByUserId;
    
    @Schema(description = "Timestamp when override was made")
    private LocalDateTime overrideAt;

    /**
     * JSON snapshots (stored as TEXT/JSON in DB)
     * rubricMetaSnapshot: Primary snapshot containing all rubric metadata and criteria (new unified format)
     * rubricsInfoSnapshot: Legacy field, now populated from rubricMetaSnapshot for backward compatibility
     * scoresJson: Assessment scores data
     */
    @Schema(description = "Rubric meta information snapshot (primary source)", example = "{\"name\":\"Oral Presentation Rubric\",\"description\":\"Evaluation criteria\",\"totalPoints\":100,\"individualRubrics\":[...],\"groupRubrics\":[...]}")
    private String rubricMetaSnapshot;
    
    /**
     * @deprecated This field is maintained for backward compatibility only.
     * Rubric criteria are now extracted from rubricMetaSnapshot based on subjectType.
     * For INDIVIDUAL assessments, data comes from rubricMetaSnapshot.individualRubrics
     * For GROUP assessments, data comes from rubricMetaSnapshot.groupRubrics
     */
    @Deprecated
    @Schema(description = "Rubrics info snapshot (deprecated, use rubricMetaSnapshot)", deprecated = true)
    private String rubricsInfoSnapshot;
    
    @Schema(description = "Assessment scores in JSON format")
    private String scoresJson;

    private LocalDateTime submittedAt;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private Integer version;
}

