package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;

@Data
@Schema(description = "Assessment key identifying a specific assessment")
public class AssessmentKeyDTO {
    
    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;
    
    @Schema(description = "Session ID", example = "90011")
    private Long sessionId;

    @Schema(description = "Submission ID (deprecated, use submissionIds)", example = "712345")
    private Long submissionId;
    
    @Schema(description = "Entity ID (groupId or studentId)", example = "200045")
    private Long entityId;

    @Schema(description = "All submission IDs associated with this assessment (per examiner)")
    private List<Long> submissionIds;
}
