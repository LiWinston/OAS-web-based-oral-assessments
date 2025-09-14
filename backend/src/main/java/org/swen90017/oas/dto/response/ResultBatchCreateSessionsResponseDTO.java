package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ResultBatchCreateSessionsResponseDTO {
    private Integer createdCount;
    private List<SessionDetailDTO> sessions;
}


