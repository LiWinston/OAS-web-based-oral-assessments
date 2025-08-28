package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import java.util.List;

@Data
public class AssignExaminersRequestDTO {
    @Schema(description = "Examiner IDs")
    @NotEmpty
    private List<Long> examinerIds;
}
