package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.ZonedDateTime;
import java.util.List;

@Data
@Schema(description = "Examiner feedback response for a result")
public class StudentExaminerFeedbackDTO implements Serializable {
    private Long resultId;
    private List<ExaminerFeedback> examinerFeedback;
    private ConsolidatedFeedback consolidatedFeedback;

    @Data
    public static class ExaminerFeedback implements Serializable {
        private Long examinerId;
        private String examinerName;
        private String overallComment;
        private List<CriterionFeedback> criterionFeedback;
        private ZonedDateTime submittedOn;
    }

    @Data
    public static class CriterionFeedback implements Serializable {
        private Long criterionId;
        private String criterionName;
        private String comment;
        private List<String> strengths;
        private List<String> improvements;
    }

    @Data
    public static class ConsolidatedFeedback implements Serializable {
        private List<String> strengths;
        private List<String> improvements;
    }
}


