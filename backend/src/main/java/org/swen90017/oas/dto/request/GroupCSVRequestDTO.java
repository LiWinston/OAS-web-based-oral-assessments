package org.swen90017.oas.dto.request;

import lombok.Data;

@Data
public class GroupCSVRequestDTO {
    private String student;  // Maps to "Student" column in CSV
    private String name;
    private String canvasUserId;
    private String userId;
    private String loginId;
    private String sections;
    private String groupName;
    private String canvasGroupId;
    private String groupId;
    private String email;
}
