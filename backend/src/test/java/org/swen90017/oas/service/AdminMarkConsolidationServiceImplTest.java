package org.swen90017.oas.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.swen90017.oas.dto.response.MarkConsolidationAlertsResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationOverviewResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationTrendsResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.service.impl.AdminMarkConsolidationServiceImpl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminMarkConsolidationServiceImplTest {

    private static final ZoneId MELBOURNE = ZoneId.of("Australia/Melbourne");

    @Mock
    private AdminResultsMapper adminResultsMapper;

    @Mock
    private AssignmentMapper assignmentMapper;

    @Mock
    private SubjectMapper subjectMapper;

    @InjectMocks
    private AdminMarkConsolidationServiceImpl service;

    @Test
    void shouldAggregateOverviewWithProgress() {
        Long subjectId = 501L;
        Long assignmentId = 101L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setSubjectId(subjectId);
        assignment.setName("Group Project Viva");

        when(assignmentMapper.selectById(assignmentId)).thenReturn(assignment);

        LocalDateTime releaseTime = LocalDateTime.of(2025, 8, 14, 11, 42, 3);
        LocalDateTime submittedTime = LocalDateTime.of(2025, 8, 14, 11, 58, 20);
        LocalDateTime reopenedUpdated = LocalDateTime.of(2025, 8, 14, 12, 15, 30);
        LocalDateTime overrideAt = LocalDateTime.of(2025, 8, 14, 9, 12, 55);
        LocalDateTime awaitingUpdated = LocalDateTime.of(2025, 8, 14, 8, 30, 0);

        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(buildRow("GROUP", 42L, 3, 3, 0, 0, "RELEASED",
                releaseTime, submittedTime, submittedTime, null, null,
                9001L, "Team Alpha", submittedTime.minusMinutes(30), submittedTime.minusMinutes(10), "Zoom"));
        rows.add(buildRow("INDIVIDUAL", 86L, 2, 1, 0, 1, "NOT_RELEASED",
                null, submittedTime.minusMinutes(20), reopenedUpdated, 88.0, overrideAt,
                9002L, "Student Beta", reopenedUpdated.minusMinutes(60), reopenedUpdated.minusMinutes(30), "Room 101"));
        rows.add(buildRow("INDIVIDUAL", 99L, 1, 0, 0, 0, "NOT_RELEASED",
                null, null, awaitingUpdated, null, null,
                9003L, "Student Gamma", awaitingUpdated.minusMinutes(45), awaitingUpdated.minusMinutes(15), "Room 102"));

        when(adminResultsMapper.listAssessmentSummaries(subjectId, assignmentId, null, null, null, null, null, "all"))
                .thenReturn(rows);

        MarkConsolidationOverviewResponseDTO overview = service.getOverview(subjectId, assignmentId, null, true);

        assertThat(overview.getAssignment().getId()).isEqualTo(assignmentId);
        assertThat(overview.getAssignment().getName()).isEqualTo("Group Project Viva");

        assertThat(overview.getTotals().getParticipants()).isEqualTo(3);
        assertThat(overview.getTotals().getGroups()).isEqualTo(1);
        assertThat(overview.getTotals().getIndividuals()).isEqualTo(2);

        assertThat(overview.getProgress().getReady()).isEqualTo(1);
        assertThat(overview.getProgress().getNeedsAttention()).isEqualTo(1);
        assertThat(overview.getProgress().getAwaiting()).isEqualTo(1);

        String expectedLastRelease = releaseTime.atZone(MELBOURNE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        assertThat(overview.getRelease().getReleased()).isEqualTo(1);
        assertThat(overview.getRelease().getNotReleased()).isEqualTo(2);
        assertThat(overview.getRelease().getLastReleasedAt()).isEqualTo(expectedLastRelease);

        assertThat(overview.getExaminerSubmissions().getTotal()).isEqualTo(6);
        assertThat(overview.getExaminerSubmissions().getSubmitted()).isEqualTo(4);
        assertThat(overview.getExaminerSubmissions().getDraft()).isEqualTo(0);
        assertThat(overview.getExaminerSubmissions().getReopened()).isEqualTo(1);
        assertThat(overview.getExaminerSubmissions().getPending()).isEqualTo(1);
        assertThat(overview.getExaminerSubmissions().getSubmittedRatio())
                .isCloseTo(4.0 / 6.0, within(0.0001));

        String expectedOverride = overrideAt.atZone(MELBOURNE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        assertThat(overview.getManualOverrides().getCount()).isEqualTo(1);
        assertThat(overview.getManualOverrides().getLastUpdatedAt()).isEqualTo(expectedOverride);

        String expectedLastActivity = reopenedUpdated.atZone(MELBOURNE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        assertThat(overview.getFreshness().getLastActivityAt()).isEqualTo(expectedLastActivity);
        assertThat(overview.getFreshness().getLastExaminerSubmissionAt())
                .isEqualTo(submittedTime.atZone(MELBOURNE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        MarkConsolidationOverviewResponseDTO withoutProgress = service.getOverview(subjectId, assignmentId, null, false);
        assertThat(withoutProgress.getProgress()).isNull();
    }

    @Test
    void shouldReturnTrendsWithZeroFillAndWeeklyAggregation() {
        Long subjectId = 701L;
        Long assignmentId = 202L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setSubjectId(subjectId);
        when(assignmentMapper.selectById(assignmentId)).thenReturn(assignment);

        LocalDate start = LocalDate.of(2025, 8, 1);
        LocalDate end = LocalDate.of(2025, 8, 3);

        List<Map<String, Object>> submissionEvents = Arrays.asList(
                event(start, 12),
                event(end, 5)
        );
        List<Map<String, Object>> overrideEvents = Collections.singletonList(event(start.plusDays(1), 2));
        List<Map<String, Object>> reopenedEvents = new ArrayList<>();

        when(adminResultsMapper.listMarkConsolidationSubmissionEvents(assignmentId, null, start.atStartOfDay(), end.plusDays(1).atStartOfDay()))
                .thenReturn(submissionEvents);
        when(adminResultsMapper.listMarkConsolidationOverrideEvents(assignmentId, null, start.atStartOfDay(), end.plusDays(1).atStartOfDay()))
                .thenReturn(overrideEvents);
        when(adminResultsMapper.listMarkConsolidationReopenedEvents(assignmentId, null, start.atStartOfDay(), end.plusDays(1).atStartOfDay()))
                .thenReturn(reopenedEvents);

        MarkConsolidationTrendsResponseDTO trends = service.getTrends(subjectId, assignmentId, null, start, end, "day");

        assertThat(trends.getInterval()).isEqualTo("day");
        assertThat(trends.getSeries()).hasSize(3);

        MarkConsolidationTrendsResponseDTO.Series submissions = trends.getSeries().get(0);
        assertThat(submissions.getPoints()).hasSize(3);
        assertThat(submissions.getPoints().get(0).getCount()).isEqualTo(12);
        assertThat(submissions.getPoints().get(1).getCount()).isZero();
        assertThat(submissions.getPoints().get(2).getCount()).isEqualTo(5);
        assertThat(submissions.getPoints().get(2).getCumulative()).isEqualTo(17);

        MarkConsolidationTrendsResponseDTO.Series overrides = trends.getSeries().get(1);
        assertThat(overrides.getPoints()).extracting(MarkConsolidationTrendsResponseDTO.Point::getCount)
                .containsExactly(0, 2, 0);

        MarkConsolidationTrendsResponseDTO.Series reopened = trends.getSeries().get(2);
        assertThat(reopened.getPoints()).extracting(MarkConsolidationTrendsResponseDTO.Point::getCount)
                .containsExactly(0, 0, 0);

        WeekFields weekFields = WeekFields.ISO;
        String expectedWeek = String.format(Locale.ENGLISH, "%d-W%02d",
                start.get(weekFields.weekBasedYear()), start.get(weekFields.weekOfWeekBasedYear()));

        MarkConsolidationTrendsResponseDTO weekly = service.getTrends(subjectId, assignmentId, null, start, end, "week");
        assertThat(weekly.getInterval()).isEqualTo("week");
        assertThat(weekly.getSeries().get(0).getPoints()).hasSize(1);
        assertThat(weekly.getSeries().get(0).getPoints().get(0).getBucket()).isEqualTo(expectedWeek);
        assertThat(weekly.getSeries().get(0).getPoints().get(0).getCount()).isEqualTo(17);
        assertThat(weekly.getSeries().get(1).getPoints().get(0).getCount()).isEqualTo(2);
    }

    @Test
    void shouldFilterAlertsAndOrderBySeverity() {
        Long subjectId = 905L;
        Long assignmentId = 303L;

        Assignment assignment = new Assignment();
        assignment.setId(assignmentId);
        assignment.setSubjectId(subjectId);
        when(assignmentMapper.selectById(assignmentId)).thenReturn(assignment);

        LocalDateTime now = LocalDateTime.now(MELBOURNE);
        LocalDateTime reopenedUpdated = now.minusHours(1);
        LocalDateTime overdueSessionEnd = now.minusHours(20);
        LocalDateTime manualOverrideAt = now.minusDays(1);

        List<Map<String, Object>> rows = Arrays.asList(
                buildRow("INDIVIDUAL", 11L, 2, 1, 0, 1, "NOT_RELEASED",
                        null, now.minusHours(2), reopenedUpdated, null, null,
                        8001L, "Student One", reopenedUpdated.minusHours(2), reopenedUpdated.minusHours(1), "Zoom"),
                buildRow("GROUP", 22L, 3, 1, 1, 0, "NOT_RELEASED",
                        null, now.minusHours(10), now.minusHours(15), null, null,
                        8002L, "Team Two", overdueSessionEnd.minusHours(2), overdueSessionEnd, "Room 201"),
                buildRow("INDIVIDUAL", 33L, 1, 1, 0, 0, "NOT_RELEASED",
                        null, now.minusHours(5), manualOverrideAt, 90.0, manualOverrideAt,
                        8003L, "Student Three", manualOverrideAt.minusHours(1), manualOverrideAt.plusHours(1), "Room 202")
        );

        when(adminResultsMapper.listAssessmentSummaries(subjectId, assignmentId, null, null, null, null, null, "all"))
                .thenReturn(rows);

        Set<String> filters = new HashSet<>(Arrays.asList("REOPENED", "OVERDUE", "MANUAL_OVERRIDE_PENDING"));
        MarkConsolidationAlertsResponseDTO alerts = service.getAlerts(subjectId, assignmentId, null, filters, 3);

        assertThat(alerts.getItems()).hasSize(3);
        assertThat(alerts.getItems().get(0).getAlertType()).isEqualTo("REOPENED");
        assertThat(alerts.getItems().get(1).getAlertType()).isEqualTo("OVERDUE");
        assertThat(alerts.getItems().get(2).getAlertType()).isEqualTo("MANUAL_OVERRIDE_PENDING");

        String expectedLastUpdated = reopenedUpdated.atZone(MELBOURNE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        assertThat(alerts.getItems().get(0).getLastUpdatedAt()).isEqualTo(expectedLastUpdated);
        assertThat(alerts.getItems().get(0).getMessage()).contains("awaiting resubmission");
        assertThat(alerts.getItems().get(1).getMessage()).contains("Awaiting submission").contains("overdue");
        assertThat(alerts.getItems().get(2).getMessage()).contains("Manual override");
    }

    private Map<String, Object> buildRow(String subjectType,
                                         Long subjectId,
                                         int total,
                                         int submitted,
                                         int draft,
                                         int reopened,
                                         String releaseStatus,
                                         LocalDateTime lastReleased,
                                         LocalDateTime lastSubmitted,
                                         LocalDateTime lastUpdated,
                                         Double overrideValue,
                                         LocalDateTime overrideAt,
                                         Long sessionId,
                                         String entityName,
                                         LocalDateTime sessionStart,
                                         LocalDateTime sessionEnd,
                                         String venueName) {
        Map<String, Object> map = new HashMap<>();
        map.put("subject_type", subjectType);
        map.put("subject_id", subjectId);
        map.put("total_examiner_count", total);
        map.put("submitted_examiner_count", submitted);
        map.put("draft_examiner_count", draft);
        map.put("reopened_examiner_count", reopened);
        map.put("release_status", releaseStatus);
        map.put("last_released_at", lastReleased);
        map.put("last_submitted_at", lastSubmitted);
        map.put("last_updated_at", lastUpdated);
        map.put("final_score_override_pct", overrideValue);
        map.put("final_score_override_at", overrideAt);
        map.put("entity_name", entityName);
        map.put("session_id", sessionId);
        map.put("session_start_at", sessionStart);
        map.put("session_end_at", sessionEnd);
        map.put("venue_name", venueName);
        return map;
    }

    private Map<String, Object> event(LocalDate date, int count) {
        Map<String, Object> map = new HashMap<>();
        map.put("event_date", date);
        map.put("event_count", count);
        return map;
    }
}

