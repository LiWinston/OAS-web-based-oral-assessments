package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Assignment-level group summary for student overview")
public class GroupSummaryDTO {

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

    @Schema(description = "Number of members in the group", example = "3")
    private Integer memberCount;

    @Schema(description = "Group status", example = "ACTIVE")
    private String status;
    
    @Schema(description = "Assignment type", example = "group", allowableValues = {"group", "mixed"})
    private String assignmentType;
}


