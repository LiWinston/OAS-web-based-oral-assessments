package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "List assignments available to examiner request")
public class ListAssignmentsRequestDTO {
    @Schema(description = "Examiner ID")
    private Long examinerId;

    @Schema(description = "Course ID filter")
    private Long courseId;

    @Schema(description = "Sort order: date_desc/date_asc")
    private String sort = "date_desc";
}


