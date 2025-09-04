package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class ExaminerBulkAssignRequestDTO {
    @Schema(description = "Examiner ID")
    @NotNull
    private Long examinerId;

    @Schema(description = "Slot IDs to assign")
    @NotEmpty
    private List<Long> slotIds;
}


