package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "List selectable time slots request")
public class ExaminerListSelectableRequestDTO {
    @Schema(description = "Examiner ID")
    private Long examinerId;

    @Schema(description = "Filter by date (YYYY-MM-DD)")
    private String date;

    @Schema(description = "Include full slots")
    private Boolean includeFullSlots = Boolean.TRUE;
}


