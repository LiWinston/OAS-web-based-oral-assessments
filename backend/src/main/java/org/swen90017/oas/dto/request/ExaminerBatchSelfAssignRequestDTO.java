package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@Schema(description = "Batch self-assign sessions request")
public class ExaminerBatchSelfAssignRequestDTO {
    @NotNull
    @Schema(description = "Examiner ID")
    private Long examinerId;

    @Schema(description = "Target session IDs")
    private List<Long> sessionIds;
}


