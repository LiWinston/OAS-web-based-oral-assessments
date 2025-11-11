package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Mark consolidation overview metrics")
public class MarkConsolidationOverviewResponseDTO {

    @Schema(description = "Assignment metadata")
    private AssignmentInfo assignment;

    @Schema(description = "Participant totals")
    private Totals totals;

    @Schema(description = "Progress breakdown across participants")
    private Progress progress;

    @Schema(description = "Release summary")
    private ReleaseSummary release;

    @Schema(description = "Examiner submission aggregates")
    private ExaminerSubmissions examinerSubmissions;

    @Schema(description = "Manual override information")
    private ManualOverrides manualOverrides;

    @Schema(description = "Freshness indicators")
    private Freshness freshness;

    @Data
    @Schema(description = "Assignment metadata")
    public static class AssignmentInfo {

        @Schema(description = "Assignment ID", example = "101")
        private Long id;

        @Schema(description = "Assignment name", example = "Group Project Viva")
        private String name;

        @Schema(description = "Course code", example = "COMP20008")
        private String courseCode;

        @Schema(description = "Course name", example = "Elements of Data Processing")
        private String courseName;
    }

    @Data
    @Schema(description = "Participant totals")
    public static class Totals {

        @Schema(description = "Total participants (groups + individuals)", example = "128")
        private Integer participants;

        @Schema(description = "Total groups", example = "42")
        private Integer groups;

        @Schema(description = "Total individuals", example = "86")
        private Integer individuals;
    }

    @Data
    @Schema(description = "Participant progress breakdown")
    public static class Progress {

        @Schema(description = "Participants ready for release", example = "80")
        private Integer ready;

        @Schema(description = "Participants needing attention", example = "12")
        private Integer needsAttention;

        @Schema(description = "Participants awaiting submissions", example = "36")
        private Integer awaiting;
    }

    @Data
    @Schema(description = "Release summary")
    public static class ReleaseSummary {

        @Schema(description = "Participants released", example = "54")
        private Integer released;

        @Schema(description = "Participants not released", example = "74")
        private Integer notReleased;

        @Schema(description = "Timestamp of the last release event (ISO-8601 with offset)", example = "2025-08-14T11:42:03+10:00")
        private String lastReleasedAt;
    }

    @Data
    @Schema(description = "Examiner submissions summary")
    public static class ExaminerSubmissions {

        @Schema(description = "Total examiner submissions", example = "210")
        private Integer total;

        @Schema(description = "Submitted examiner counts", example = "168")
        private Integer submitted;

        @Schema(description = "Draft examiner counts", example = "22")
        private Integer draft;

        @Schema(description = "Reopened examiner counts", example = "6")
        private Integer reopened;

        @Schema(description = "Pending examiner counts", example = "14")
        private Integer pending;

        @Schema(description = "Submitted ratio between 0 and 1", example = "0.8")
        private Double submittedRatio;
    }

    @Data
    @Schema(description = "Manual override summary")
    public static class ManualOverrides {

        @Schema(description = "Number of manual overrides applied", example = "7")
        private Integer count;

        @Schema(description = "Last manual override timestamp (ISO-8601 with offset)", example = "2025-08-14T09:12:55+10:00")
        private String lastUpdatedAt;
    }

    @Data
    @Schema(description = "Freshness metrics across the assignment")
    public static class Freshness {

        @Schema(description = "Last activity timestamp (ISO-8601 with offset)", example = "2025-08-14T12:15:30+10:00")
        private String lastActivityAt;

        @Schema(description = "Last examiner submission timestamp (ISO-8601 with offset)", example = "2025-08-14T11:58:20+10:00")
        private String lastExaminerSubmissionAt;
    }
}
