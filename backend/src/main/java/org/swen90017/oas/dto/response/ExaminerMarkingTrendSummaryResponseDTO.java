package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Response payload for Examiner Marking Trend summary endpoint.
 */
@Data
public class ExaminerMarkingTrendSummaryResponseDTO {

    private Long assignmentId;
    private String status;
    private Boolean hasMixedSubjects;
    private CohortStats cohort;
    private Extremes extremes;
    private List<ExaminerRow> examiners;

    @Data
    public static class CohortStats {
        private Integer examinerCount;
        private Integer submissionCount;
        private Double averageScore;
    }

    @Data
    public static class Extremes {
        private ExtremesEntry highest;
        private ExtremesEntry lowest;
    }

    @Data
    public static class ExtremesEntry {
        private Long examinerId;
        private String examinerName;
        private Double averageScore;
    }

    @Data
    public static class ExaminerRow {
        private Long examinerId;
        private String examinerName;
        private String examinerEmail;
        private Integer submissionCount;
        private Double averageScore;
        private Double delta;
    }
}
