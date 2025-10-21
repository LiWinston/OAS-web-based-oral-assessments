package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
@Schema(description = "Assessment summary for list view")
public class AssessmentSummaryDTO {

    @Schema(description = "Assessment information")
    private AssessmentInfo assessment;

    @Schema(description = "Session information")
    private AssessmentSessionDTO session;

    @Schema(description = "Computed scores")
    private AssessmentComputedDTO computed;

    @Schema(description = "Release status", example = "NOT_RELEASED", allowableValues = {"NOT_RELEASED", "RELEASED"})
    private String releaseStatus;

    @Schema(description = "Release mode", example = "FULL", allowableValues = {"FULL", "SCORES_ONLY"})
    private String releaseMode;

    @Schema(description = "Examiner progress summary for this assessment")
    private ExaminerSummary examinerSummary;

    @Schema(description = "Snapshot of examiner submissions")
    private List<ExaminerSnapshot> examiners = Collections.emptyList();

    @Schema(description = "Latest submission timestamp among examiners (ISO 8601)")
    private String lastSubmittedAt;

    @Schema(description = "Latest update timestamp among examiner submissions (ISO 8601)")
    private String lastUpdatedAt;

    @Data
    @Schema(description = "Assessment information")
    public static class AssessmentInfo {
        @Schema(description = "Assessment key")
        private AssessmentKeyDTO key;

        @Schema(description = "Student information (for individual assessments)")
        private StudentInfo student;

        @Schema(description = "Group information (for group assessments)")
        private GroupInfo group;

        @Data
        @Schema(description = "Student information")
        public static class StudentInfo {
            @Schema(description = "Student ID", example = "200045")
            private Long id;

            @Schema(description = "Student name", example = "Alice Tan")
            private String name;
        }

        @Data
        @Schema(description = "Group information")
        public static class GroupInfo {
            @Schema(description = "Group ID", example = "300012")
            private Long id;

            @Schema(description = "Group name", example = "Team Alpha")
            private String name;

            @Schema(description = "Number of group members", example = "4")
            private Integer memberCount;
        }
    }

    @Data
    @Schema(description = "Examiner submission progress summary")
    public static class ExaminerSummary {
        @Schema(description = "Total examiners assigned", example = "3")
        private Integer total;

        @Schema(description = "Examiners submitted", example = "2")
        private Integer submitted;

        @Schema(description = "Examiners still drafting", example = "1")
        private Integer draft;

        @Schema(description = "Examiners reopened by admin", example = "0")
        private Integer reopened;

        @Schema(description = "Pending examiners (total - submitted)", example = "1")
        private Integer pending;

        @Schema(description = "Submitted ratio between 0 and 1", example = "0.66")
        private Double submittedRatio;

        @Schema(description = "Whether all examiners have submitted", example = "false")
        private Boolean allSubmitted;

        @Schema(description = "Whether any examiner is in draft", example = "true")
        private Boolean anyDraft;

        @Schema(description = "Whether any examiner has been reopened", example = "false")
        private Boolean anyReopened;
    }

    @Data
    @Schema(description = "Examiner submission snapshot for list views")
    public static class ExaminerSnapshot {
        @Schema(description = "Submission ID for this examiner", example = "712345")
        private Long submissionId;

        @Schema(description = "Examiner ID", example = "501")
        private Long examinerId;

        @Schema(description = "Examiner name", example = "Dr. Smith")
        private String examinerName;

        @Schema(description = "Assessment status", example = "SUBMITTED", allowableValues = {"DRAFT", "SUBMITTED", "REOPENED"})
        private String status;

        @Schema(description = "Examiner score percentage (mix rubric adjusted when applicable)", example = "83.0")
        private Double scorePct1dp;

        @Schema(description = "Submitted timestamp if applicable (ISO 8601)", example = "2025-09-15T09:25:00+10:00")
        private String submittedAt;

        @Schema(description = "Reopened timestamp if applicable (ISO 8601)", example = "2025-09-18T12:00:00+10:00")
        private String reopenedAt;
    }
}
