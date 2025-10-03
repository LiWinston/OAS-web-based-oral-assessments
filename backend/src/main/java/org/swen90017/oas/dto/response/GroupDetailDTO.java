package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Assignment-level group details")
public class GroupDetailDTO {

    @Schema(description = "Group ID", example = "501")
    private Long groupId;

    @Schema(description = "Group name", example = "Team Alpha")
    private String groupName;

    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    @Schema(description = "Assignment name", example = "Oral Exam 1")
    private String assignmentName;

    @Schema(description = "Course code", example = "COMP90082")
    private String courseCode;

    @Schema(description = "Semester label", example = "2025 S1")
    private String semester;
    
    @Schema(description = "Assignment type", example = "group", allowableValues = {"group", "mixed"})
    private String assignmentType;

    @Schema(description = "Group members")
    private List<Member> members;

    @Data
    @Schema(description = "Member in a group")
    public static class Member {
        @Schema(description = "Student ID", example = "201")
        private Long studentId;
        @Schema(description = "Student name", example = "Bob Student")
        private String name;
        @Schema(description = "Student email", example = "bob@student.unimelb.edu.au")
        private String email;
    }
}


