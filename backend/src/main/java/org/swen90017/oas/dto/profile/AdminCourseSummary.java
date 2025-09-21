package org.swen90017.oas.dto.profile;

import lombok.Data;

@Data
public class AdminCourseSummary {
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private String status;
    private Integer assignmentCount;
    private Integer unstaffedSessions;
}
