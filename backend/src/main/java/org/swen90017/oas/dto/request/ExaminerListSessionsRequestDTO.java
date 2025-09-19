package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "List sessions for examiner request")
public class ExaminerListSessionsRequestDTO {
    @Schema(description = "Filter by date (YYYY-MM-DD)")
    private String date;

    @Schema(description = "Filter by venue ID")
    private Long venueId;

    @Schema(description = "Filter by status")
    private String status;
}


