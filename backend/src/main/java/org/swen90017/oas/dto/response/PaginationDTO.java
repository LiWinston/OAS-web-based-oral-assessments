package org.swen90017.oas.dto.response;

import lombok.Data;

@Data
public class PaginationDTO {
    private Integer currentPage;
    private Integer totalPages;
    private Long totalItems;
    private Integer itemsPerPage;
    private Boolean hasNext;
    private Boolean hasPrev;
}


