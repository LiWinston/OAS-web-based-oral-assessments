package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Session list for admin results")
public class AdminSessionResultsDTO {
    
    @Schema(description = "List of sessions")
    private List<SessionItem> sessions;
    
    @Data
    @Schema(description = "Session item with participant count")
    public static class SessionItem {
        @Schema(description = "Session ID", example = "804")
        private Long sessionId;
        
        @Schema(description = "Session start time (ISO 8601 with timezone)", example = "2025-10-22T09:35:00+11:00")
        private String start;
        
        @Schema(description = "Session end time (ISO 8601 with timezone)", example = "2025-10-22T10:05:00+11:00")
        private String end;
        
        @Schema(description = "Timezone", example = "Australia/Melbourne")
        private String timezone;
        
        @Schema(description = "Venue information")
        private VenueInfo venue;
        
        @Schema(description = "Number of participants in this session", example = "3")
        private Long participantCount;
        
        @Data
        @Schema(description = "Venue information")
        public static class VenueInfo {
            @Schema(description = "Venue ID", example = "2352")
            private Long venueId;
            
            @Schema(description = "Venue name", example = "Alan Gilbert Building (Par 210)")
            private String name;
        }
    }
}

