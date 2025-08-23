package org.swen90017.oas.dto.request;

import lombok.Data;

/**
 * Common pagination request base class
 */
@Data
public class PageRequestDTO {
    /** Page number, starts from 1 */
    private Integer page = 1;
    /** Page size, default 20, max 100 */
    private Integer limit = 20;
    /** Sort field, default create_time */
    private String sortBy = "create_time";
    /** Sort order asc/desc, default desc */
    private String sortOrder = "desc";
}


