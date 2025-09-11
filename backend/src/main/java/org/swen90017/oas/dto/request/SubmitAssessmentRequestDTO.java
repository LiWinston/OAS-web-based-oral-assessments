package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Submit assessment request")
public class SubmitAssessmentRequestDTO {
    private Long submissionId; // preferred

    // 或者使用定位键（当 submissionId 未传）
    private Long assignmentId;
    private Long sessionId;
    private String subjectType;
    private Long subjectId;
}


