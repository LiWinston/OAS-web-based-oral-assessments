package org.swen90017.oas.dto.response;

import lombok.Data;

@Data
public class AdminActivityDTO {
    private String action;
    private String description;
    private String timestamp; // ISO8601 string for now
}


