package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Submit assessment request")
public class SubmitAssessmentRequestDTO {
    private Long submissionId; // preferred

    // 或者使用定位键（当 submissionId 未传）
    private Long assignmentId;
    private Long sessionId;
    private String subjectType;
    private Long subjectId;

    // 直接提交时可一并携带与草稿相同的内容
    @Schema(description = "Overall feedback for student/group")
    private String overallFeedback;
    @Schema(description = "Admin-only note")
    private String adminNote;
    @Schema(description = "Scores array aligning to rubrics_info by description")
    private List<SaveAssessmentDraftRequestDTO.ScoreItem> scores;
}


