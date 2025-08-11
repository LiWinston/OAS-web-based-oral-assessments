package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.dto.response.GroupPreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysStudent;

import java.util.List;

public interface GroupService {
    /**
     * Import group data
     */
    List<SysStudent> importGroupData(List<GroupCSVRequestDTO> dtos);

    /**
     * Preview group CSV import
     */
    GroupPreviewCSVResponseDTO previewGroupImport(List<GroupCSVRequestDTO> groupDTOs);
}
