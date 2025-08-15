package org.swen90017.oas.dto.response;

import lombok.Data;

@Data
public class AdminCourseDTO {
    private String id;
    private String code;
    private String name;
    private String semester;
    private Integer year;
    private Integer studentsCount;
}


