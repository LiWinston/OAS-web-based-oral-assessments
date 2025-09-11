package org.swen90017.oas.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Save assessment draft request")
public class SaveAssessmentDraftRequestDTO {
    private Long assignmentId;
    private Long sessionId; // optional
    private String subjectType; // STUDENT | GROUP
    private Long subjectId;

    private String overallFeedback;
    private String adminNote; // visible to admins only

    @Schema(description = "Scores array aligning to rubrics_info by description")
    private List<ScoreItem> scores;

    @Data
    public static class ScoreItem {
        private String description;   // rubric item description (match key)
        private String scaleType;     // points | descriptive
        private Double weight;        // from rubric

        private Double inputPoints;   // for scaleType=points (0..100)

        private SelectedLevel selectedLevel; // for scaleType=descriptive

        private String comment;
    }

    @Data
    public static class SelectedLevel {
        private String description;
        private Double startPoint;
        private Double endPoint;
    }
}


