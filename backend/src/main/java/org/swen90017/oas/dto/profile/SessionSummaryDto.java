package org.swen90017.oas.dto.profile;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class SessionSummaryDto {
    private Long sessionId;
    private Long assignmentId;
    private String assignmentName;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String venueName;
}
