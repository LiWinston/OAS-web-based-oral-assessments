package org.swen90017.oas.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ExaminerSummaryDTO {
    private Integer draftCount;
    private Integer submittedCount;
    private List<ByAssignment> byAssignment;

    @Data
    public static class ByAssignment {
        private Long assignmentId;
        private String assignmentName;
        private Integer draft;
        private Integer submitted;
    }
}


