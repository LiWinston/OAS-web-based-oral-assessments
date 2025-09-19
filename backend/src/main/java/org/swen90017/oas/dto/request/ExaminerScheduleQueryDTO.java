package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Examiner schedule query")
public class ExaminerScheduleQueryDTO {
    @Schema(description = "Optional assignment filter")
    private Long assignmentId;
}


