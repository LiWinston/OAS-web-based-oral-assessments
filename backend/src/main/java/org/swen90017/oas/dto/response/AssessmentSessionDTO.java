package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Session information for an assessment")
public class AssessmentSessionDTO {
    
    @Schema(description = "Session ID", example = "90011")
    private Long id;
    
    @Schema(description = "Session start time", example = "2025-04-14T10:00:00+10:00")
    private String start;
    
    @Schema(description = "Session end time", example = "2025-04-14T10:30:00+10:00")
    private String end;
    
    @Schema(description = "Session timezone", example = "Australia/Melbourne")
    private String timezone;
    
    @Schema(description = "Venue information")
    private VenueInfo venue;
    
    @Data
    @Schema(description = "Venue information")
    public static class VenueInfo {
        @Schema(description = "Venue ID", example = "1")
        private Long venueId;
        
        @Schema(description = "Venue name", example = "Room 101")
        private String name;
    }
}
