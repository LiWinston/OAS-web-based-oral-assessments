package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Group Context Response DTO
 * Used for returning group context information for a student in an assignment
 */
@Schema(description = "Group context response data")
@Data
public class GroupContextResponseDTO {

    /**
     * Group ID
     */
    @Schema(description = "Group ID", example = "501")
    private Long groupId;

    /**
     * Group name
     */
    @Schema(description = "Group name", example = "Team Alpha")
    private String groupName;

    /**
     * Assignment ID
     */
    @Schema(description = "Assignment ID", example = "101")
    private Long assignmentId;

    /**
     * List of group members
     */
    @Schema(description = "List of group members")
    private List<GroupMemberDTO> members;

    /**
     * Group Member DTO
     */
    @Data
    @Schema(description = "Group member information")
    public static class GroupMemberDTO {

        /**
         * Student ID
         */
        @Schema(description = "Student ID", example = "201")
        private Long studentId;

        /**
         * Student name
         */
        @Schema(description = "Student name", example = "Bob Student")
        private String name;

        /**
         * Student email
         */
        @Schema(description = "Student email", example = "bob@student.unimelb.edu.au")
        private String email;
    }
}
