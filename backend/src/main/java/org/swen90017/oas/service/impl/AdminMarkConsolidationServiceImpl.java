package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.response.MarkConsolidationAlertsResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationOverviewResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationTrendsResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.service.AdminMarkConsolidationService;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminMarkConsolidationServiceImpl implements AdminMarkConsolidationService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Australia/Melbourne");
    private static final DateTimeFormatter ISO_OFFSET_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final DateTimeFormatter HUMAN_DATE_FORMATTER = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final int DEFAULT_ALERT_LIMIT = 10;
    private static final int MAX_ALERT_LIMIT = 25;
    private static final Duration OVERDUE_GRACE = Duration.ofHours(12);
    private static final List<String> ALERT_PRIORITY = Collections.unmodifiableList(
            Arrays.asList("REOPENED", "OVERDUE", "MANUAL_OVERRIDE_PENDING", "MISSING_EXAMINER")
    );
    private static final Map<String, Integer> ALERT_PRIORITY_MAP = buildPriorityMap();

    private final AdminResultsMapper adminResultsMapper;
    private final AssignmentMapper assignmentMapper;
    private final SubjectMapper subjectMapper;

    @Override
    public MarkConsolidationOverviewResponseDTO getOverview(Long subjectId,
                                                            Long assignmentId,
                                                            Long sessionId,
                                                            boolean includeProgressBreakdown) {
        Assignment assignment = validateAssignment(subjectId, assignmentId);
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());

        List<Map<String, Object>> rows = fetchParticipantRows(subjectId, assignmentId, sessionId);
        Map<String, ParticipantAggregate> aggregates = buildParticipantAggregates(rows);

        MarkConsolidationOverviewResponseDTO response = new MarkConsolidationOverviewResponseDTO();
        response.setAssignment(buildAssignmentInfo(assignment, subject));
        response.setTotals(buildTotals(aggregates.values()));

        if (includeProgressBreakdown) {
            response.setProgress(buildProgress(aggregates.values()));
        }

        response.setRelease(buildReleaseSummary(aggregates.values()));
        response.setExaminerSubmissions(buildExaminerSubmissions(aggregates.values()));
        response.setManualOverrides(buildManualOverrides(aggregates.values()));
        response.setFreshness(buildFreshness(aggregates.values()));

        return response;
    }

    @Override
    public MarkConsolidationTrendsResponseDTO getTrends(Long subjectId,
                                                        Long assignmentId,
                                                        Long sessionId,
                                                        LocalDate rangeStart,
                                                        LocalDate rangeEnd,
                                                        String interval) {
        validateAssignment(subjectId, assignmentId);
        String safeInterval = normaliseInterval(interval);

        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        LocalDate start = Optional.ofNullable(rangeStart).orElse(today.minusDays(13));
        LocalDate end = Optional.ofNullable(rangeEnd).orElse(today);

        if (end.isBefore(start)) {
            throw new BusinessException("rangeEnd must not be before rangeStart", BusinessError.INVALID_PARAM.getCode());
        }

        LocalDateTime rangeStartDateTime = start.atStartOfDay();
        LocalDateTime rangeEndExclusive = end.plusDays(1).atStartOfDay();

        List<Map<String, Object>> submissionEvents = adminResultsMapper.listMarkConsolidationSubmissionEvents(
                assignmentId, sessionId, rangeStartDateTime, rangeEndExclusive);
        List<Map<String, Object>> overrideEvents = adminResultsMapper.listMarkConsolidationOverrideEvents(
                assignmentId, sessionId, rangeStartDateTime, rangeEndExclusive);
        List<Map<String, Object>> reopenedEvents = adminResultsMapper.listMarkConsolidationReopenedEvents(
                assignmentId, sessionId, rangeStartDateTime, rangeEndExclusive);

        Map<LocalDate, Integer> submissionCounts = toDailyCountMap(submissionEvents);
        Map<LocalDate, Integer> overrideCounts = toDailyCountMap(overrideEvents);
        Map<LocalDate, Integer> reopenedCounts = toDailyCountMap(reopenedEvents);

        MarkConsolidationTrendsResponseDTO response = new MarkConsolidationTrendsResponseDTO();
        response.setInterval(safeInterval);
        response.setTimezone(DEFAULT_ZONE.getId());

        MarkConsolidationTrendsResponseDTO.Series submissionsSeries = new MarkConsolidationTrendsResponseDTO.Series();
        submissionsSeries.setName("Examiner submissions");
        submissionsSeries.setKey("submitted");
        submissionsSeries.setPoints(buildPoints(start, end, submissionCounts, safeInterval));

        MarkConsolidationTrendsResponseDTO.Series overridesSeries = new MarkConsolidationTrendsResponseDTO.Series();
        overridesSeries.setName("Manual overrides");
        overridesSeries.setKey("overrides");
        overridesSeries.setPoints(buildPoints(start, end, overrideCounts, safeInterval));

        MarkConsolidationTrendsResponseDTO.Series reopenedSeries = new MarkConsolidationTrendsResponseDTO.Series();
        reopenedSeries.setName("Reopened assessments");
        reopenedSeries.setKey("reopened");
        reopenedSeries.setPoints(buildPoints(start, end, reopenedCounts, safeInterval));

        response.setSeries(Arrays.asList(submissionsSeries, overridesSeries, reopenedSeries));
        return response;
    }

    @Override
    public MarkConsolidationAlertsResponseDTO getAlerts(Long subjectId,
                                                        Long assignmentId,
                                                        Long sessionId,
                                                        Set<String> types,
                                                        int limit) {
        validateAssignment(subjectId, assignmentId);
        int safeLimit = computeAlertLimit(limit);
        Set<String> filters = normaliseAlertTypes(types);

        List<Map<String, Object>> rows = fetchParticipantRows(subjectId, assignmentId, sessionId);
        if (rows.isEmpty()) {
            return emptyAlerts();
        }

        List<AlertCandidate> candidates = rows.stream()
                .map(row -> createAlertCandidate(row, filters))
                .filter(Objects::nonNull)
                .sorted(alertComparator())
                .collect(Collectors.toList());

        List<MarkConsolidationAlertsResponseDTO.AlertItem> items = candidates.stream()
                .limit(safeLimit)
                .map(AlertCandidate::item)
                .collect(Collectors.toList());

        MarkConsolidationAlertsResponseDTO response = new MarkConsolidationAlertsResponseDTO();
        response.setItems(items);
        return response;
    }

    private Assignment validateAssignment(Long subjectId, Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        if (!Objects.equals(assignment.getSubjectId(), subjectId)) {
            throw new BusinessException(BusinessError.SUBJECT_NOT_FOUND);
        }
        return assignment;
    }

    private List<Map<String, Object>> fetchParticipantRows(Long subjectId, Long assignmentId, Long sessionId) {
        List<Map<String, Object>> rows = adminResultsMapper.listAssessmentSummaries(
                subjectId, assignmentId, sessionId, null, null, null, null, "all");
        return rows != null ? rows : Collections.emptyList();
    }

    private Map<String, ParticipantAggregate> buildParticipantAggregates(List<Map<String, Object>> rows) {
        Map<String, ParticipantAggregate> aggregates = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String subjectType = stringValue(row.get("subject_type"));
            Long subjectId = longValue(row.get("subject_id"));
            String key = subjectType + ":" + subjectId;
            ParticipantAggregate aggregate = aggregates.computeIfAbsent(key,
                    k -> new ParticipantAggregate(subjectType, subjectId));
            aggregate.merge(row);
        }
        return aggregates;
    }

    private MarkConsolidationOverviewResponseDTO.AssignmentInfo buildAssignmentInfo(Assignment assignment, Subject subject) {
        MarkConsolidationOverviewResponseDTO.AssignmentInfo info = new MarkConsolidationOverviewResponseDTO.AssignmentInfo();
        info.setId(assignment.getId());
        info.setName(assignment.getName());
        info.setCourseCode(subject != null ? subject.getSubjectCode() : null);
        info.setCourseName(subject != null ? subject.getSubjectName() : null);
        return info;
    }

    private MarkConsolidationOverviewResponseDTO.Totals buildTotals(Collection<ParticipantAggregate> aggregates) {
        int groups = 0;
        int individuals = 0;
        for (ParticipantAggregate aggregate : aggregates) {
            if ("INDIVIDUAL".equals(aggregate.subjectType)) {
                individuals++;
            } else {
                groups++;
            }
        }

        MarkConsolidationOverviewResponseDTO.Totals totals = new MarkConsolidationOverviewResponseDTO.Totals();
        totals.setIndividuals(individuals);
        totals.setGroups(groups);
        totals.setParticipants(groups + individuals);
        return totals;
    }

    private MarkConsolidationOverviewResponseDTO.Progress buildProgress(Collection<ParticipantAggregate> aggregates) {
        int ready = 0;
        int needsAttention = 0;
        int awaiting = 0;

        for (ParticipantAggregate aggregate : aggregates) {
            if (aggregate.reopenedExaminerCount > 0) {
                needsAttention++;
            } else if (aggregate.totalExaminerCount > 0
                    && aggregate.submittedExaminerCount == aggregate.totalExaminerCount) {
                ready++;
            } else {
                awaiting++;
            }
        }

        MarkConsolidationOverviewResponseDTO.Progress progress = new MarkConsolidationOverviewResponseDTO.Progress();
        progress.setReady(ready);
        progress.setNeedsAttention(needsAttention);
        progress.setAwaiting(awaiting);
        return progress;
    }

    private MarkConsolidationOverviewResponseDTO.ReleaseSummary buildReleaseSummary(Collection<ParticipantAggregate> aggregates) {
        int released = 0;
        LocalDateTime latestReleasedAt = null;

        for (ParticipantAggregate aggregate : aggregates) {
            if (aggregate.released) {
                released++;
                latestReleasedAt = max(latestReleasedAt, aggregate.lastReleasedAt);
            }
        }

        MarkConsolidationOverviewResponseDTO.ReleaseSummary summary = new MarkConsolidationOverviewResponseDTO.ReleaseSummary();
        summary.setReleased(released);
        summary.setNotReleased(Math.max(0, aggregates.size() - released));
        summary.setLastReleasedAt(formatWithZone(latestReleasedAt));
        return summary;
    }

    private MarkConsolidationOverviewResponseDTO.ExaminerSubmissions buildExaminerSubmissions(Collection<ParticipantAggregate> aggregates) {
        int total = 0;
        int submitted = 0;
        int draft = 0;
        int reopened = 0;

        for (ParticipantAggregate aggregate : aggregates) {
            total += aggregate.totalExaminerCount;
            submitted += aggregate.submittedExaminerCount;
            draft += aggregate.draftExaminerCount;
            reopened += aggregate.reopenedExaminerCount;
        }

        int pending = Math.max(total - submitted - draft - reopened, 0);

        MarkConsolidationOverviewResponseDTO.ExaminerSubmissions summary = new MarkConsolidationOverviewResponseDTO.ExaminerSubmissions();
        summary.setTotal(total);
        summary.setSubmitted(submitted);
        summary.setDraft(draft);
        summary.setReopened(reopened);
        summary.setPending(pending);
        summary.setSubmittedRatio(total > 0 ? (double) submitted / total : 0.0);
        return summary;
    }

    private MarkConsolidationOverviewResponseDTO.ManualOverrides buildManualOverrides(Collection<ParticipantAggregate> aggregates) {
        int count = 0;
        LocalDateTime latestOverride = null;

        for (ParticipantAggregate aggregate : aggregates) {
            if (aggregate.hasManualOverride) {
                count++;
                latestOverride = max(latestOverride, aggregate.lastOverrideAt);
            }
        }

        MarkConsolidationOverviewResponseDTO.ManualOverrides overrides = new MarkConsolidationOverviewResponseDTO.ManualOverrides();
        overrides.setCount(count);
        overrides.setLastUpdatedAt(formatWithZone(latestOverride));
        return overrides;
    }

    private MarkConsolidationOverviewResponseDTO.Freshness buildFreshness(Collection<ParticipantAggregate> aggregates) {
        LocalDateTime lastActivity = null;
        LocalDateTime lastSubmission = null;

        for (ParticipantAggregate aggregate : aggregates) {
            lastActivity = max(lastActivity, aggregate.lastActivityAt());
            lastSubmission = max(lastSubmission, aggregate.lastSubmittedAt);
        }

        MarkConsolidationOverviewResponseDTO.Freshness freshness = new MarkConsolidationOverviewResponseDTO.Freshness();
        freshness.setLastActivityAt(formatWithZone(lastActivity));
        freshness.setLastExaminerSubmissionAt(formatWithZone(lastSubmission));
        return freshness;
    }

    private Map<LocalDate, Integer> toDailyCountMap(List<Map<String, Object>> events) {
        if (events == null || events.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<LocalDate, Integer> counts = new HashMap<>();
        for (Map<String, Object> row : events) {
            LocalDate date = toLocalDate(row.get("event_date"));
            int count = intValue(row.get("event_count"));
            counts.merge(date, count, Integer::sum);
        }
        return counts;
    }

    private List<MarkConsolidationTrendsResponseDTO.Point> buildPoints(LocalDate start,
                                                                       LocalDate end,
                                                                       Map<LocalDate, Integer> counts,
                                                                       String interval) {
        List<MarkConsolidationTrendsResponseDTO.Point> points = new ArrayList<>();

        if ("week".equals(interval)) {
            WeekFields iso = WeekFields.ISO;
            Map<String, Integer> weeklyCounts = new LinkedHashMap<>();
            LocalDate cursor = start;
            while (!cursor.isAfter(end)) {
                String bucket = weekBucket(cursor, iso);
                int value = counts.getOrDefault(cursor, 0);
                weeklyCounts.merge(bucket, value, Integer::sum);
                cursor = cursor.plusDays(1);
            }

            int cumulative = 0;
            for (Map.Entry<String, Integer> entry : weeklyCounts.entrySet()) {
                cumulative += entry.getValue();
                MarkConsolidationTrendsResponseDTO.Point point = new MarkConsolidationTrendsResponseDTO.Point();
                point.setBucket(entry.getKey());
                point.setCount(entry.getValue());
                point.setCumulative(cumulative);
                points.add(point);
            }
        } else {
            LocalDate cursor = start;
            int cumulative = 0;
            while (!cursor.isAfter(end)) {
                int count = counts.getOrDefault(cursor, 0);
                cumulative += count;
                MarkConsolidationTrendsResponseDTO.Point point = new MarkConsolidationTrendsResponseDTO.Point();
                point.setBucket(cursor.toString());
                point.setCount(count);
                point.setCumulative(cumulative);
                points.add(point);
                cursor = cursor.plusDays(1);
            }
        }

        return points;
    }

    private AlertCandidate createAlertCandidate(Map<String, Object> row, Set<String> filters) {
        String rawType = stringValue(row.get("subject_type"));
        String subjectType = rawType == null ? "UNKNOWN" : rawType.toUpperCase(Locale.ROOT);
        if ("MIX".equals(subjectType)) {
            subjectType = "GROUP";
        }

        Long participantId = longObject(row.get("subject_id"));
        if (participantId == null) {
            participantId = 0L;
        }
        Long sessionId = longObject(row.get("session_id"));
        String entityName = stringValue(row.get("entity_name"));
        if (entityName == null || entityName.trim().isEmpty()) {
            entityName = subjectType + " " + participantId;
        }

        int total = intValue(row.get("total_examiner_count"));
        int submitted = intValue(row.get("submitted_examiner_count"));
        int draft = intValue(row.get("draft_examiner_count"));
        int reopened = intValue(row.get("reopened_examiner_count"));
        int pending = Math.max(total - submitted - draft - reopened, 0);
        boolean released = "RELEASED".equalsIgnoreCase(stringValue(row.get("release_status")));
        boolean hasOverride = row.get("final_score_override_pct") != null;

        LocalDateTime lastUpdated = toLocalDateTime(row.get("last_updated_at"));
        LocalDateTime lastSubmitted = toLocalDateTime(row.get("last_submitted_at"));
        LocalDateTime lastReleased = toLocalDateTime(row.get("last_released_at"));
        LocalDateTime overrideAt = toLocalDateTime(row.get("final_score_override_at"));

        LocalDateTime activity = max(max(lastUpdated, lastSubmitted), max(lastReleased, overrideAt));

        LocalDateTime sessionStart = toLocalDateTime(row.get("session_start_at"));
        LocalDateTime sessionEnd = toLocalDateTime(row.get("session_end_at"));
        String venueName = stringValue(row.get("venue_name"));

        Set<String> triggered = new LinkedHashSet<>();
        if (reopened > 0) {
            triggered.add("REOPENED");
        }
        if (sessionEnd != null) {
            ZonedDateTime sessionEndZoned = sessionEnd.atZone(DEFAULT_ZONE);
            ZonedDateTime cutoff = sessionEndZoned.plus(OVERDUE_GRACE);
            if (ZonedDateTime.now(DEFAULT_ZONE).isAfter(cutoff) && submitted < total) {
                triggered.add("OVERDUE");
            }
        }
        if (hasOverride && !released) {
            triggered.add("MANUAL_OVERRIDE_PENDING");
        }
        if (total == 0 || (submitted == 0 && draft == 0 && reopened == 0)) {
            triggered.add("MISSING_EXAMINER");
        }

        if (!filters.isEmpty()) {
            triggered.retainAll(filters);
        }

        if (triggered.isEmpty()) {
            return null;
        }

        String alertType = selectAlertType(triggered);
        if (alertType == null) {
            return null;
        }

        String message = buildAlertMessage(alertType, reopened, pending, overrideAt, sessionEnd, activity);

        MarkConsolidationAlertsResponseDTO.AlertItem item = new MarkConsolidationAlertsResponseDTO.AlertItem();
        item.setAlertType(alertType);
        item.setMessage(message);
        item.setLastUpdatedAt(formatWithZone(activity));

        MarkConsolidationAlertsResponseDTO.Participant participant = new MarkConsolidationAlertsResponseDTO.Participant();
        participant.setId(participantId);
        participant.setType(subjectType);
        participant.setName(entityName);

        MarkConsolidationAlertsResponseDTO.Session session = new MarkConsolidationAlertsResponseDTO.Session();
        session.setId(sessionId);
        session.setStart(formatWithZone(sessionStart));
        session.setEnd(formatWithZone(sessionEnd));
        session.setVenueName(venueName);
        participant.setSession(session);
        item.setParticipant(participant);

        MarkConsolidationAlertsResponseDTO.ExaminerSummary summary = new MarkConsolidationAlertsResponseDTO.ExaminerSummary();
        summary.setTotal(total);
        summary.setSubmitted(submitted);
        summary.setReopened(reopened);
        summary.setPending(pending);
        item.setExaminerSummary(summary);

        int priority = ALERT_PRIORITY_MAP.getOrDefault(alertType, ALERT_PRIORITY.size());
        return new AlertCandidate(item, activity, priority);
    }

    private String buildAlertMessage(String alertType,
                                     int reopened,
                                     int pending,
                                     LocalDateTime overrideAt,
                                     LocalDateTime sessionEnd,
                                     LocalDateTime activity) {
        switch (alertType) {
            case "REOPENED":
                return "Examiner marking reopened on " + formatForMessage(activity)
                        + ", awaiting resubmission from " + reopened + " examiner(s).";
            case "OVERDUE":
                Duration overdue = sessionEnd != null ? Duration.between(sessionEnd, LocalDateTime.now(DEFAULT_ZONE)) : null;
                return "Awaiting submission from " + pending + " examiner(s) ("
                        + formatOverdue(overdue) + ").";
            case "MANUAL_OVERRIDE_PENDING":
                return "Manual override applied on " + formatForMessage(overrideAt)
                        + ", release still pending.";
            case "MISSING_EXAMINER":
                return "No examiner submissions recorded yet.";
            default:
                return "Attention required.";
        }
    }

    private Comparator<AlertCandidate> alertComparator() {
        return Comparator
                .comparingInt(AlertCandidate::priority)
                .thenComparing(AlertCandidate::lastActivity, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private MarkConsolidationAlertsResponseDTO emptyAlerts() {
        return new MarkConsolidationAlertsResponseDTO();
    }

    private int computeAlertLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_ALERT_LIMIT;
        }
        return Math.min(limit, MAX_ALERT_LIMIT);
    }

    private Set<String> normaliseAlertTypes(Set<String> types) {
        if (types == null || types.isEmpty()) {
            return Collections.emptySet();
        }
        return types.stream()
                .filter(Objects::nonNull)
                .map(type -> type.trim().toUpperCase(Locale.ROOT))
                .filter(type -> ALERT_PRIORITY_MAP.containsKey(type))
                .collect(Collectors.toCollection(HashSet::new));
    }

    private String selectAlertType(Set<String> triggered) {
        return triggered.stream()
                .sorted(Comparator.comparingInt(type -> ALERT_PRIORITY_MAP.getOrDefault(type, ALERT_PRIORITY.size())))
                .findFirst()
                .orElse(null);
    }

    private String formatOverdue(Duration duration) {
        if (duration == null || duration.isNegative() || duration.isZero()) {
            return "overdue";
        }
        long totalHours = Math.max(duration.toHours(), 1);
        long days = totalHours / 24;
        long hours = totalHours % 24;
        if (days > 0 && hours > 0) {
            return String.format(Locale.ENGLISH, "overdue by %dd %dh", days, hours);
        }
        if (days > 0) {
            return String.format(Locale.ENGLISH, "overdue by %dd", days);
        }
        return String.format(Locale.ENGLISH, "overdue by %dh", totalHours);
    }

    private String formatWithZone(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.atZone(DEFAULT_ZONE).format(ISO_OFFSET_FORMATTER);
    }

    private String formatForMessage(LocalDateTime value) {
        if (value == null) {
            return "recently";
        }
        return value.atZone(DEFAULT_ZONE).format(HUMAN_DATE_FORMATTER);
    }

    private String normaliseInterval(String interval) {
        if (interval == null) {
            return "day";
        }
        String lower = interval.trim().toLowerCase(Locale.ROOT);
        if ("week".equals(lower)) {
            return "week";
        }
        return "day";
    }

    private static Map<String, Integer> buildPriorityMap() {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < ALERT_PRIORITY.size(); i++) {
            map.put(ALERT_PRIORITY.get(i), i);
        }
        return map;
    }

    private static String weekBucket(LocalDate date, WeekFields iso) {
        int week = date.get(iso.weekOfWeekBasedYear());
        int year = date.get(iso.weekBasedYear());
        return String.format(Locale.ENGLISH, "%d-W%02d", year, week);
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }
        if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).toLocalDate();
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate();
        }
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime().toLocalDate();
        }
        throw new IllegalArgumentException("Unsupported date type: " + value.getClass());
    }

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime();
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate().atStartOfDay();
        }
        if (value instanceof LocalDate) {
            return ((LocalDate) value).atStartOfDay();
        }
        throw new IllegalArgumentException("Unsupported datetime type: " + value.getClass());
    }

    private static int intValue(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private static long longValue(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return Long.parseLong(value.toString());
    }

    private static Long longObject(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return Long.valueOf(value.toString());
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private static LocalDateTime max(LocalDateTime first, LocalDateTime second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return first.isAfter(second) ? first : second;
    }

    private static class ParticipantAggregate {
        private final String subjectType;
        private final Long subjectId;
        private int totalExaminerCount;
        private int submittedExaminerCount;
        private int draftExaminerCount;
        private int reopenedExaminerCount;
        private boolean released;
        private boolean hasManualOverride;
        private LocalDateTime lastReleasedAt;
        private LocalDateTime lastSubmittedAt;
        private LocalDateTime lastUpdatedAt;
        private LocalDateTime lastOverrideAt;

        ParticipantAggregate(String subjectType, Long subjectId) {
            this.subjectType = subjectType == null ? "UNKNOWN" : subjectType.toUpperCase(Locale.ROOT);
            this.subjectId = subjectId;
        }

        void merge(Map<String, Object> row) {
            this.totalExaminerCount += intValue(row.get("total_examiner_count"));
            this.submittedExaminerCount += intValue(row.get("submitted_examiner_count"));
            this.draftExaminerCount += intValue(row.get("draft_examiner_count"));
            this.reopenedExaminerCount += intValue(row.get("reopened_examiner_count"));

            String releaseStatus = stringValue(row.get("release_status"));
            if ("RELEASED".equalsIgnoreCase(releaseStatus)) {
                this.released = true;
            }

            if (row.get("final_score_override_pct") != null) {
                this.hasManualOverride = true;
            }

            this.lastReleasedAt = max(this.lastReleasedAt, toLocalDateTime(row.get("last_released_at")));
            this.lastSubmittedAt = max(this.lastSubmittedAt, toLocalDateTime(row.get("last_submitted_at")));
            this.lastUpdatedAt = max(this.lastUpdatedAt, toLocalDateTime(row.get("last_updated_at")));
            this.lastOverrideAt = max(this.lastOverrideAt, toLocalDateTime(row.get("final_score_override_at")));
        }

        LocalDateTime lastActivityAt() {
            return max(max(lastUpdatedAt, lastSubmittedAt), max(lastReleasedAt, lastOverrideAt));
        }
    }

    private static final class AlertCandidate {
        private final MarkConsolidationAlertsResponseDTO.AlertItem item;
        private final LocalDateTime lastActivity;
        private final int priority;

        private AlertCandidate(MarkConsolidationAlertsResponseDTO.AlertItem item,
                               LocalDateTime lastActivity,
                               int priority) {
            this.item = item;
            this.lastActivity = lastActivity;
            this.priority = priority;
        }

        MarkConsolidationAlertsResponseDTO.AlertItem item() {
            return item;
        }

        LocalDateTime lastActivity() {
            return lastActivity;
        }

        int priority() {
            return priority;
        }
    }
}

