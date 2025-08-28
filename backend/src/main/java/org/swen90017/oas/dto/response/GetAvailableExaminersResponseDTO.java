package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;
@Data
public class GetAvailableExaminersResponseDTO {
    @Schema(description = "Examiners")
    private List<ExaminerDetailDTO> examiners;
}
