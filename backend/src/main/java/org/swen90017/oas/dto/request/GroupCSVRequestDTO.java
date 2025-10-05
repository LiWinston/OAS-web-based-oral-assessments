package org.swen90017.oas.dto.request;

import lombok.Data;

@Data
public class GroupCSVRequestDTO {
    private String student;      // Maps to "Student" column in CSV
    private String name;
    private String id;           // Maps to "ID" column in CSV
    private String canvasUserId;
    private String userId;       // Legacy field
    private String studentId;    // Maps to "Student Id" column in CSV
    private String sisUserId;    // Maps to "SIS User ID" column in CSV
    private String loginId;      // Legacy field
    private String sisLoginId;   // Maps to "SIS Login ID" column in CSV
    private String section;      // Maps to "Section" column in CSV
    private String sections;     // Legacy field
    private String groupName;
    private String canvasGroupId;
    private String groupId;
    private String email;
}
