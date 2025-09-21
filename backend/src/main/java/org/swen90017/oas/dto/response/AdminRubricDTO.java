package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Complete rubric information for admin results")
public class AdminRubricDTO {
    
    @Schema(description = "Rubric meta information")
    private AdminRubricMetaInfoDTO rubricMetaInfo;
    
    @Schema(description = "Rubric criteria")
    private List<AdminRubricCriterionDTO> criteria;
}
