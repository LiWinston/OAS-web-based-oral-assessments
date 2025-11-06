package org.swen90017.oas.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.response.ExaminerMarkingTrendSummaryResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.service.impl.AdminReportServiceImpl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminReportServiceImplTest {

    @Mock
    private AssignmentMapper assignmentMapper;

    @Mock
    private AdminResultsMapper adminResultsMapper;

    @Mock
    private AssessmentSubmissionMapper assessmentSubmissionMapper;

    @InjectMocks
    private AdminReportServiceImpl adminReportService;

    @Test
    void shouldBuildSummaryWithAllStatusAndMixedSubjects() {
        Long assignmentId = 101L;
        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        when(assignmentMapper.selectById(assignmentId)).thenReturn(assignment);

        List<Map<String, Object>> aggregates = new ArrayList<>();
        aggregates.add(buildRow(11L, "Alice", "alice@example.com", 1L, 3L, 3L,
                new BigDecimal("210.0"), 3L));
        aggregates.add(buildRow(12L, "Bob", "bob@example.com", 2L, 3L, 3L,
                new BigDecimal("240.0"), 3L));
        aggregates.add(buildRow(13L, "Charlie", "charlie@example.com", 1L, 2L, 0L,
                BigDecimal.ZERO, 0L));

        when(adminResultsMapper.listExaminerSummary(eq(assignmentId), anyList(), eq(0))).thenReturn(aggregates);
        when(adminResultsMapper.countDistinctSessionsForAssignment(eq(assignmentId), anyList())).thenReturn(3);
        when(assessmentSubmissionMapper.findDistinctSubjectTypesByAssignment(assignmentId))
                .thenReturn(java.util.Arrays.asList("INDIVIDUAL", "GROUP"));

        ExaminerMarkingTrendSummaryResponseDTO response =
                adminReportService.getExaminerMarkingTrendSummary(assignmentId, "ALL", 0);

        assertThat(response.getStatus()).isEqualTo("ALL");
        assertThat(response.getAssignmentId()).isEqualTo(assignmentId);
        assertThat(response.getCohort().getExaminerCount()).isEqualTo(3);
        assertThat(response.getCohort().getSubmissionCount()).isEqualTo(8);
        assertThat(response.getCohort().getSessionCount()).isEqualTo(3);
        assertThat(response.getCohort().getAverageScore()).isEqualTo(75.0);
        assertThat(response.getHasMixedSubjects()).isTrue();

        assertThat(response.getExaminers()).hasSize(3);
        ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow first = response.getExaminers().get(0);
        assertThat(first.getExaminerName()).isEqualTo("Alice");
        assertThat(first.getSessionCount()).isEqualTo(1);
        assertThat(first.getAverageScore()).isEqualTo(70.0);
        assertThat(first.getDelta()).isEqualTo(-5.0);

        ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow second = response.getExaminers().get(1);
        assertThat(second.getSessionCount()).isEqualTo(2);
        assertThat(second.getAverageScore()).isEqualTo(80.0);
        assertThat(second.getDelta()).isEqualTo(5.0);

        ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow third = response.getExaminers().get(2);
        assertThat(third.getSessionCount()).isEqualTo(1);
        assertThat(third.getAverageScore()).isNull();
        assertThat(third.getDelta()).isNull();

        assertThat(response.getExtremes().getHighest().getExaminerId()).isEqualTo(12L);
        assertThat(response.getExtremes().getLowest().getExaminerId()).isEqualTo(11L);
    }

    @Test
    void shouldThrowWhenStatusInvalid() {
        Long assignmentId = 102L;
        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        when(assignmentMapper.selectById(assignmentId)).thenReturn(assignment);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                adminReportService.getExaminerMarkingTrendSummary(assignmentId, "INVALID", 0));

        assertThat(exception.getCode()).isEqualTo(BusinessError.REPORT_INVALID_STATUS.getCode());
    }

    private Map<String, Object> buildRow(Long examinerId,
                                         String name,
                                         String email,
                                         Long sessionCount,
                                         Long submissionCount,
                                         Long submittedCount,
                                         BigDecimal scoreSum,
                                         Long scoreCount) {
        Map<String, Object> map = new HashMap<>();
        map.put("examiner_id", examinerId);
        map.put("examiner_name", name);
        map.put("examiner_email", email);
        map.put("session_count", sessionCount);
        map.put("submission_count", submissionCount);
        map.put("submitted_count", submittedCount);
        map.put("submitted_score_sum", scoreSum);
        map.put("submitted_score_count", scoreCount);
        return map;
    }
}
