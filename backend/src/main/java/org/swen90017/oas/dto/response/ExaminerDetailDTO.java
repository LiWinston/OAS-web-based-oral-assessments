package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Examiner detail DTO")
public class ExaminerDetailDTO {

    @Schema(description = "Examiner ID", example = "1")
    private Long id;

    @Schema(description = "Examiner name", example = "Dr. Emma Thompson")
    private String name;

    @Schema(description = "Examiner email", example = "emma.thompson@university.edu")
    private String email;
}
