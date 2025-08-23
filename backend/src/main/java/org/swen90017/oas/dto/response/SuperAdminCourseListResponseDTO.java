package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Super Admin course list response")
public class SuperAdminCourseListResponseDTO {
    private List<SuperAdminCourseItemDTO> courses;
    private PaginationDTO pagination;
}


