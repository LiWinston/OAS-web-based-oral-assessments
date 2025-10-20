package org.swen90017.oas.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Participants list for a session")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminSessionParticipantsDTO {
    
    @Schema(description = "List of participants (can be groups or individuals)")
    private List<ParticipantItem> participants;
    
    @Data
    @Schema(description = "Participant item (group or individual)")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ParticipantItem {
        
        // Group fields
        @Schema(description = "Group ID (only for GROUP type)", example = "30")
        private Long groupId;
        
        @Schema(description = "Group name (only for GROUP type)", example = "W07G6")
        private String groupName;
        
        @Schema(description = "Number of members (only for GROUP type)", example = "2")
        private Long memberCount;
        
        @Schema(description = "Group members (only for GROUP type)")
        private List<MemberInfo> members;
        
        // Individual fields
        @Schema(description = "Student ID (only for INDIVIDUAL type)", example = "3")
        private Long studentId;
        
        @Schema(description = "Student name (only for INDIVIDUAL type)", example = "Bob")
        private String name;
        
        @Schema(description = "Student number (only for INDIVIDUAL type)", example = "123456")
        private String studentNumber;
        
        // Common fields
        @Schema(description = "Release status", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
        private String releaseStatus;
        
        @Data
        @Schema(description = "Group member information")
        public static class MemberInfo {
            @Schema(description = "Student ID", example = "3")
            private Long studentId;
            
            @Schema(description = "Student name", example = "Bob")
            private String name;
        }
    }
}

