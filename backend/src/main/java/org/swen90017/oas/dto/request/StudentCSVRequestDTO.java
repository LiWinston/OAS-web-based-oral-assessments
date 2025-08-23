package org.swen90017.oas.dto.request;

import lombok.Data;

@Data
public class StudentCSVRequestDTO {
    private String student;
    private String id;
    private String sisUserId;
    private String sisLoginId;
    private String section;
    private String studentId;
    private String courseId;
    private String assignmentId;
}
