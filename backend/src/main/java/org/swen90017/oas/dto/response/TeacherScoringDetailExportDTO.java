package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Teacher Scoring Detail Export DTO
 * Format: name	canvas_user_id	SIS ID	login_id	Section	group_name	canvas_group_id	examiner_name	examiner_username	exam_date	exam_time_slot	exam_venue	Sample1(Sample ID1) -example: rubric 1 (123456)	Sample2(Sample ID2) -example: rubric 2(786543)
 */
@Data
public class TeacherScoringDetailExportDTO {
    
    private String name;
    private String canvasUserId;
    private String sisId;
    private String loginId;
    private String section;
    private String groupName;
    private String canvasGroupId;
    private String examDate;
    private String examTimeSlot;
    private String examVenue;
    
    /**
     * Dynamic list of examiner scores on the same row
     */
    private List<ExaminerScore> examinerScores = new ArrayList<>();

    /**
     * Average rubric score across all examiners for this row
     */
    private Map<String, String> rubricAverageScores = new LinkedHashMap<>();

    @Data
    public static class ExaminerScore {
        private Long examinerId;
        private String examinerName;
        private String examinerUsername;
        private Map<String, String> rubricScores = new LinkedHashMap<>();
    }
}

