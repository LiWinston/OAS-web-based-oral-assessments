package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
@Schema(description = "Mark consolidation alerts payload")
public class MarkConsolidationAlertsResponseDTO {

    @Schema(description = "Alert items sorted by severity and recency")
    private List<AlertItem> items = Collections.emptyList();

    @Data
    @Schema(description = "Single alert entry")
    public static class AlertItem {

        @Schema(description = "Participant details")
        private Participant participant;

        @Schema(description = "Alert type", example = "REOPENED")
        private String alertType;

        @Schema(description = "Human readable message", example = "Examiner Dr Jones reopened on 13 Aug, waiting for resubmission.")
        private String message;

        @Schema(description = "Examiner summary snapshot")
        private ExaminerSummary examinerSummary;

        @Schema(description = "Last activity timestamp (ISO-8601 with offset)", example = "2025-08-13T17:45:00+10:00")
        private String lastUpdatedAt;
    }

    @Data
    @Schema(description = "Participant descriptor")
    public static class Participant {

        @Schema(description = "Participant ID", example = "3301")
        private Long id;

        @Schema(description = "Participant type", example = "GROUP", allowableValues = {"GROUP", "INDIVIDUAL"})
        private String type;

        @Schema(description = "Participant name", example = "W04 Tutorial Team 2")
        private String name;

        @Schema(description = "Session information")
        private Session session;
    }

    @Data
    @Schema(description = "Session descriptor for an alert")
    public static class Session {

        @Schema(description = "Session ID", example = "90045")
        private Long id;

        @Schema(description = "Session start time ISO-8601 with offset", example = "2025-08-13T14:00:00+10:00")
        private String start;

        @Schema(description = "Session end time ISO-8601 with offset", example = "2025-08-13T14:30:00+10:00")
        private String end;

        @Schema(description = "Venue name", example = "Zoom")
        private String venueName;
    }

    @Data
    @Schema(description = "Examiner summary for an alert")
    public static class ExaminerSummary {

        @Schema(description = "Total examiners", example = "2")
        private Integer total;

        @Schema(description = "Submitted examiners", example = "1")
        private Integer submitted;

        @Schema(description = "Reopened examiners", example = "1")
        private Integer reopened;

        @Schema(description = "Pending examiners", example = "0")
        private Integer pending;
    }
}
