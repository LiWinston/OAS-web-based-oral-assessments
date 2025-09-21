package org.swen90017.oas.dto.profile;

import lombok.Data;

@Data
public class AdminTaskSummary {
    private Integer unstaffedSessions;
    private Integer openSessions;
    private Integer assignmentsPending;
}
