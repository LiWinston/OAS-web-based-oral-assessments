package org.swen90017.oas.dto.request;

import lombok.Data;

@Data
public class ExaminerCSVRequestDTO {
    private String name;
    private String id;
    private String sisUserId;
    private String sisLoginId;
    private String section;
    private String courseId;
    private String assignmentId;
}
