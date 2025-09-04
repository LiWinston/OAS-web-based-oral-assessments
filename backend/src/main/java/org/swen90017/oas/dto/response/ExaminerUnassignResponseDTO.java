package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Response for examiner unassignment operation")
public class ExaminerUnassignResponseDTO {

    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    @Schema(description = "Time slot ID", example = "5001")
    private Long slotId;

    @Schema(description = "Examiner ID", example = "601")
    private Long examinerId;

    @Schema(description = "Updated total assigned sessions for this examiner in this assignment", example = "3")
    private Integer updatedAssignedSessions;
}
