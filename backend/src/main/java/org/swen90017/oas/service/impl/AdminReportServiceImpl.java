package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.response.ExaminerMarkingTrendSummaryResponseDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AdminResultsMapper;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.service.AdminReportService;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminReportServiceImpl implements AdminReportService {

    private static final String STATUS_SUBMITTED = "SUBMITTED";
    private static final String STATUS_ALL = "ALL";
    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_REOPENED = "REOPENED";

    private final AssignmentMapper assignmentMapper;
    private final AdminResultsMapper adminResultsMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;

    @Override
    public ExaminerMarkingTrendSummaryResponseDTO getExaminerMarkingTrendSummary(Long assignmentId,
                                                                                String status,
                                                                                Integer minSessions) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        String normalisedStatus = normaliseStatus(status);
        List<String> statusesForCount = resolveStatusesForCount(normalisedStatus);

        int safeMinSessions = minSessions == null ? 0 : Math.max(minSessions, 0);

        List<Map<String, Object>> aggregates = adminResultsMapper.listExaminerSummary(
                assignmentId, statusesForCount, safeMinSessions);

        List<ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow> examinerRows = new ArrayList<>();
        double totalScoreSum = 0.0;
        long totalScoreCount = 0L;
        long totalSubmissionCount = 0L;

        for (Map<String, Object> row : aggregates) {
            ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow dtoRow = new ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow();
            Long examinerId = toLong(row.get("examiner_id"));
            dtoRow.setExaminerId(examinerId);
            dtoRow.setExaminerName((String) row.get("examiner_name"));
            dtoRow.setExaminerEmail((String) row.get("examiner_email"));

            long submissionCount = toLong(row.get("submission_count"));
            double submittedScoreSum = toDouble(row.get("submitted_score_sum"));
            long submittedScoreCount = toLong(row.get("submitted_score_count"));

            dtoRow.setSubmissionCount((int) submissionCount);

            Double average = submittedScoreCount > 0 ? submittedScoreSum / submittedScoreCount : null;
            dtoRow.setAverageScore(average);

            examinerRows.add(dtoRow);

            totalScoreSum += submittedScoreSum;
            totalScoreCount += submittedScoreCount;
            totalSubmissionCount += submissionCount;
        }

        Double cohortAverage = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : null;

        for (ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow row : examinerRows) {
            if (row.getAverageScore() == null || cohortAverage == null) {
                row.setDelta(null);
            } else {
                row.setDelta(row.getAverageScore() - cohortAverage);
            }
        }

        ExaminerMarkingTrendSummaryResponseDTO.Extremes extremes = buildExtremes(examinerRows);

        ExaminerMarkingTrendSummaryResponseDTO.CohortStats cohort = new ExaminerMarkingTrendSummaryResponseDTO.CohortStats();
        cohort.setExaminerCount(examinerRows.size());
        cohort.setSubmissionCount((int) totalSubmissionCount);
        cohort.setAverageScore(cohortAverage);

        ExaminerMarkingTrendSummaryResponseDTO response = new ExaminerMarkingTrendSummaryResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setStatus(normalisedStatus);
        response.setCohort(cohort);
        response.setExaminers(examinerRows);
        response.setExtremes(extremes);
        response.setHasMixedSubjects(resolveHasMixedSubjects(assignmentId, assignment));

        return response;
    }

    private String normaliseStatus(String status) {
        String resolved = status == null ? STATUS_SUBMITTED : status.trim().toUpperCase(Locale.ROOT);
        if (STATUS_SUBMITTED.equals(resolved) || STATUS_ALL.equals(resolved)) {
            return resolved;
        }
        throw new BusinessException(BusinessError.REPORT_INVALID_STATUS);
    }

    private List<String> resolveStatusesForCount(String status) {
        if (STATUS_ALL.equals(status)) {
            return new ArrayList<>(Arrays.asList(STATUS_SUBMITTED, STATUS_DRAFT, STATUS_REOPENED));
        }
        return Collections.singletonList(STATUS_SUBMITTED);
    }

    private ExaminerMarkingTrendSummaryResponseDTO.Extremes buildExtremes(
            List<ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow> rows) {

        List<ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow> withAverage = rows.stream()
                .filter(r -> r.getAverageScore() != null)
                .collect(Collectors.toList());

        ExaminerMarkingTrendSummaryResponseDTO.Extremes extremes = new ExaminerMarkingTrendSummaryResponseDTO.Extremes();
        if (withAverage.isEmpty()) {
            return extremes;
        }

        Comparator<ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow> comparator =
                Comparator.comparing(ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow::getAverageScore);

        ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow lowest = withAverage.stream().min(comparator).orElse(null);
        ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow highest = withAverage.stream().max(comparator).orElse(null);

        extremes.setLowest(convertToExtremesEntry(lowest));
        extremes.setHighest(convertToExtremesEntry(highest));

        return extremes;
    }

    private ExaminerMarkingTrendSummaryResponseDTO.ExtremesEntry convertToExtremesEntry(
            ExaminerMarkingTrendSummaryResponseDTO.ExaminerRow row) {
        if (row == null) {
            return null;
        }
        ExaminerMarkingTrendSummaryResponseDTO.ExtremesEntry entry =
                new ExaminerMarkingTrendSummaryResponseDTO.ExtremesEntry();
        entry.setExaminerId(row.getExaminerId());
        entry.setExaminerName(row.getExaminerName());
        entry.setAverageScore(row.getAverageScore());
        return entry;
    }

    private boolean resolveHasMixedSubjects(Long assignmentId, Assignment assignment) {
        List<String> subjectTypes = assessmentSubmissionMapper.findDistinctSubjectTypesByAssignment(assignmentId);
        if (CollectionUtils.isEmpty(subjectTypes)) {
            if (assignment != null && assignment.getType() != null) {
                return "MIXED".equalsIgnoreCase(assignment.getType());
            }
            return false;
        }
        Set<String> normalised = subjectTypes.stream()
                .filter(Objects::nonNull)
                .map(type -> type.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (normalised.isEmpty()) {
            return false;
        }
        if (normalised.contains("MIX")) {
            return true;
        }
        return normalised.size() > 1;
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Long) {
            return (Long) value;
        }
        if (value instanceof Integer) {
            return ((Integer) value).longValue();
        }
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).longValue();
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ex) {
            log.warn("Unable to parse long from value: {}", value, ex);
            return 0L;
        }
    }

    private double toDouble(Object value) {
        if (value == null) {
            return 0.0;
        }
        if (value instanceof Double) {
            return (Double) value;
        }
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).doubleValue();
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            log.warn("Unable to parse double from value: {}", value, ex);
            return 0.0;
        }
    }
}
