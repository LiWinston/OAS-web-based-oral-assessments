package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.PerformanceDto;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.dto.response.StudentResultDetailDTO;
import org.swen90017.oas.dto.response.StudentResultOverviewDTO;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.entity.SysStudentGroup;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.mapper.SysStudentGroupMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.StudentResultsService;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.utils.RubricParser;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
public class StudentResultsServiceImpl implements StudentResultsService {

    private static final Logger logger = LoggerFactory.getLogger(StudentResultsServiceImpl.class);

    private static final ZoneId UTC = ZoneId.of("UTC");
    private static final ZoneId LOCAL_ZONE = ZoneId.of("Australia/Melbourne");
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>> SCORE_ITEM_LIST =
            new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {};

    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final ObjectMapper objectMapper;
    private final SubjectService subjectService;

    @Override
    public StudentResultOverviewDTO listStudentResults(Long studentId,
                                                       String status,
                                                       String semester,
                                                       int pageNum,
                                                       int pageSize,
                                                       String sort,
                                                       String ifModifiedSince) {
        ensureUserExists(studentId);

        Set<Long> assignmentIds = collectCandidateAssignmentIds(studentId);
        logger.debug("Listing student results: studentId={}, status={}, semester={}, pageNum={}, pageSize={}, sort={}, candidateAssignments={}",
                studentId, status, semester, pageNum, pageSize, sort, assignmentIds.size());
        if (assignmentIds.isEmpty()) {
            logger.debug("No candidate assignments found for student {}, returning empty overview.", studentId);
            StudentResultOverviewDTO empty = new StudentResultOverviewDTO();
            empty.setPageNum(pageNum);
            empty.setPageSize(pageSize);
            empty.setTotal(0L);
            empty.setData(new ArrayList<>());
            return empty;
        }

        List<StudentResultOverviewDTO.Item> items = new ArrayList<>();

        for (Long assignmentId : assignmentIds) {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment == null) {
                logger.debug("Skipping assignment {} for student {}: assignment record not found.", assignmentId, studentId);
                continue;
            }

            boolean assignmentResultsReleased = Boolean.TRUE.equals(assignment.getResultsReleased());
            boolean releasedOnly = !"all".equalsIgnoreCase(status);

            List<AssessmentSubmission> submissions = assessmentSubmissionMapper
                    .listByStudentAndAssignmentWithGroups(studentId, assignmentId, "SUBMITTED");
            if (CollectionUtils.isEmpty(submissions)) {
                logger.debug("Skipping assignment {}: no submitted assessments for student {}.", assignmentId, studentId);
                continue;
            }

            List<AssessmentSubmission> releasedSubmissions = submissions.stream()
                    .filter(sub -> "RELEASED".equalsIgnoreCase(sub.getReleaseStatus()))
                    .collect(Collectors.toList());
            boolean hasReleasedSubmissions = !releasedSubmissions.isEmpty();

            if (releasedOnly && !assignmentResultsReleased && !hasReleasedSubmissions) {
                logger.debug("Skipping assignment {}: neither assignment nor submissions are released.", assignmentId);
                continue;
            }

            if (releasedSubmissions.isEmpty()) {
                if (!assignmentResultsReleased) {
                    logger.debug("Skipping assignment {}: no released submissions for student {} ({} submissions filtered).",
                            assignmentId, studentId, submissions.size());
                    continue;
                }
            }

            List<AssessmentSubmission> aggregationSource = hasReleasedSubmissions ? releasedSubmissions : submissions;

            AggregationPayload payload = aggregateAssignmentResult(assignment, aggregationSource);
            if (payload == null) {
                logger.warn("Skipping assignment {}: failed to aggregate released submissions for student {}.", assignmentId, studentId);
                continue;
            }

            CourseInfo courseInfo = getCourseInfoFromAssignment(assignment);

            StudentResultOverviewDTO.Item item = new StudentResultOverviewDTO.Item();
            item.setAssignmentId(assignmentId);
            item.setAssignmentName(assignment.getName());
            item.setCourseCode(courseInfo.getCourseCode());
            item.setCourseName(courseInfo.getCourseName());
            item.setSemester(courseInfo.getSemester());
            item.setAssignmentType(normalizeAssignmentType(assignment.getType()));
            item.setStatus(assignment.getStatus());
            item.setResultsReleased(assignmentResultsReleased || hasReleasedSubmissions);
            item.setHasMixedRubric(payload.isHasMixedRubric());
            item.setReleasedAt(
                    assignment.getResultsReleasedAt() != null
                            ? toIsoString(assignment.getResultsReleasedAt())
                            : toIsoString(payload.getLatestSubmissionTime()));
            item.setAssessedOn(toIsoString(payload.getLatestSubmissionTime()));

            StudentResultOverviewDTO.FinalScore finalScore = new StudentResultOverviewDTO.FinalScore();
            finalScore.setGrade(calculateGrade(payload.getTotalPoints(), payload.getMaxPoints()));
            finalScore.setPercentage(roundOneDecimal(payload.getPercentage()));
            finalScore.setTotalPoints(roundOneDecimal(payload.getTotalPoints()));
            finalScore.setMaxPoints(roundOneDecimal(payload.getMaxPoints()));
            item.setFinalScore(finalScore);

            items.add(item);
        }

        if (items.isEmpty()) {
            StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
            dto.setPageNum(pageNum);
            dto.setPageSize(pageSize);
            dto.setTotal(0L);
            dto.setData(new ArrayList<>());
            return dto;
        }

        List<StudentResultOverviewDTO.Item> filtered = filterBySemester(items, semester);
        List<StudentResultOverviewDTO.Item> sorted = applySorting(filtered, sort);

        int safePageNum = Math.max(pageNum, 1);
        int safePageSize = Math.max(pageSize, 1);
        int startIndex = (safePageNum - 1) * safePageSize;
        int endIndex = Math.min(startIndex + safePageSize, sorted.size());

        List<StudentResultOverviewDTO.Item> pageData = startIndex >= sorted.size()
                ? new ArrayList<>()
                : sorted.subList(startIndex, endIndex);

        StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
        dto.setPageNum(safePageNum);
        dto.setPageSize(safePageSize);
        dto.setTotal((long) sorted.size());
        dto.setData(new ArrayList<>(pageData));
        logger.debug("Returning {} overview items (filteredCount={}, pageWindow=[{},{})) for student {}.",
                pageData.size(), sorted.size(), startIndex, endIndex, studentId);
        return dto;
    }

    @Override
    public StudentResultDetailDTO getAssignmentResultDetail(Long studentId,
                                                            Long assignmentId,
                                                            String ifModifiedSince) {
        ensureUserExists(studentId);
        ensureAssignmentParticipation(studentId, assignmentId);

        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        List<AssessmentSubmission> submissions = assessmentSubmissionMapper
                .listByStudentAndAssignmentWithGroups(studentId, assignmentId, "SUBMITTED");
        List<AssessmentSubmission> releasedSubmissions = submissions.stream()
                .filter(sub -> "RELEASED".equalsIgnoreCase(sub.getReleaseStatus()))
                .collect(Collectors.toList());
        boolean assignmentResultsReleased = Boolean.TRUE.equals(assignment.getResultsReleased());
        boolean hasReleasedSubmissions = !releasedSubmissions.isEmpty();
        boolean releasedFlag = hasReleasedSubmissions || assignmentResultsReleased;
        if (!releasedFlag) {
            throw new BusinessException(BusinessError.NOT_RELEASED);
        }

        List<AssessmentSubmission> aggregationSource = hasReleasedSubmissions ? releasedSubmissions : submissions;

        AggregationPayload payload = aggregateAssignmentResult(assignment, aggregationSource);
        if (payload == null) {
            throw new BusinessException("500", "Unable to aggregate released results for this assignment.");
        }

        StudentResultDetailDTO response = new StudentResultDetailDTO();

        CourseInfo courseInfo = getCourseInfoFromAssignment(assignment);
        StudentResultDetailDTO.AssignmentInfo assignmentInfo = new StudentResultDetailDTO.AssignmentInfo();
        assignmentInfo.setAssignmentId(assignmentId);
        assignmentInfo.setAssignmentName(assignment.getName());
        assignmentInfo.setCourseCode(courseInfo.getCourseCode());
        assignmentInfo.setCourseName(courseInfo.getCourseName());
        assignmentInfo.setSemester(courseInfo.getSemester());
        assignmentInfo.setType(normalizeAssignmentType(assignment.getType()));
        assignmentInfo.setStatus(assignment.getStatus());
        assignmentInfo.setResultsReleased(releasedFlag);
        assignmentInfo.setResultsReleasedAt(
                assignment.getResultsReleasedAt() != null
                        ? toIsoString(assignment.getResultsReleasedAt())
                        : toIsoString(payload.getLatestSubmissionTime()));
        response.setAssignment(assignmentInfo);

        StudentResultDetailDTO.ReleaseInfo releaseInfo = new StudentResultDetailDTO.ReleaseInfo();
        releaseInfo.setReleased(releasedFlag);
        releaseInfo.setReleasedAt(
                assignment.getResultsReleasedAt() != null
                        ? toIsoString(assignment.getResultsReleasedAt())
                        : toIsoString(payload.getLatestSubmissionTime()));
        releaseInfo.setNotifiedStudents(null);
        releaseInfo.setFinalisedBy(null);
        releaseInfo.setFinalisedByName(null);
        response.setRelease(releaseInfo);

        StudentResultDetailDTO.FinalScore finalScore = new StudentResultDetailDTO.FinalScore();
        finalScore.setGrade(calculateGrade(payload.getTotalPoints(), payload.getMaxPoints()));
        finalScore.setPercentage(roundOneDecimal(payload.getPercentage()));
        finalScore.setTotalPoints(roundOneDecimal(payload.getTotalPoints()));
        finalScore.setMaxPoints(roundOneDecimal(payload.getMaxPoints()));
        response.setFinalScore(finalScore);

        StudentResultDetailDTO.Rubric rubric = new StudentResultDetailDTO.Rubric();
        rubric.setSections(payload.getSections());

        StudentResultDetailDTO.RubricAggregate aggregate = new StudentResultDetailDTO.RubricAggregate();
        aggregate.setTotalPoints(roundOneDecimal(payload.getTotalPoints()));
        aggregate.setMaxPoints(roundOneDecimal(payload.getMaxPoints()));
        aggregate.setPercentage(roundOneDecimal(payload.getPercentage()));
        rubric.setAggregate(aggregate);
        rubric.setDefinition(buildRubricDefinition(payload.getMetaInfo()));
        response.setRubric(rubric);

        List<StudentResultDetailDTO.OverallCommentByExaminer> overallDtos = payload.getOverallExaminerComments().stream()
                .sorted(Comparator
                        .comparing(ExaminerComment::getSubmittedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(comment -> formatExaminerLabel(comment.getExaminerId(), comment.getExaminerName())))
                .map(comment -> {
                    StudentResultDetailDTO.OverallCommentByExaminer dto =
                            new StudentResultDetailDTO.OverallCommentByExaminer();
                    dto.setExaminerId(comment.getExaminerId());
                    dto.setExaminerName(comment.getExaminerName());
                    dto.setComment(comment.getComment());
                    return dto;
                })
                .collect(Collectors.toList());

        StudentResultDetailDTO.Feedback feedback = new StudentResultDetailDTO.Feedback();
        feedback.setOverallCommentsByExaminer(overallDtos);
        feedback.setOverallCommentsCombined(combineComments(payload.getOverallExaminerComments()));
        feedback.setStrengthsCombined(null);
        feedback.setImprovementsCombined(null);
        response.setFeedback(feedback);

        if (payload.getPrimarySessionId() != null) {
            SlotSession session = slotSessionMapper.selectById(payload.getPrimarySessionId());
            if (session != null) {
                StudentResultDetailDTO.SessionInfo sessionInfo = new StudentResultDetailDTO.SessionInfo();
                sessionInfo.setSessionId(session.getSessionId());
                sessionInfo.setSessionLabel(buildSessionLabel(session));
                sessionInfo.setStartsAt(toIsoString(session.getStartAt()));
                sessionInfo.setEndsAt(toIsoString(session.getEndAt()));
                response.setSession(sessionInfo);
            }
        }

        return response;
    }

    private Set<Long> collectCandidateAssignmentIds(Long studentId) {
        Set<Long> assignmentIds = new LinkedHashSet<>();

        List<AssessmentSubmission> directSubmissions = assessmentSubmissionMapper
                .listByStudent(studentId, null, "SUBMITTED");
        if (!CollectionUtils.isEmpty(directSubmissions)) {
            directSubmissions.stream()
                    .map(AssessmentSubmission::getAssignmentId)
                    .filter(Objects::nonNull)
                    .forEach(assignmentIds::add);
        }

        QueryWrapper<AssignmentParticipant> participantWrapper = new QueryWrapper<>();
        participantWrapper.eq("user_id", studentId)
                .eq("role_id", UserRole.STUDENT.sort());
        List<AssignmentParticipant> participations = assignmentParticipantMapper.selectList(participantWrapper);
        if (!CollectionUtils.isEmpty(participations)) {
            participations.stream()
                    .map(AssignmentParticipant::getAssignmentId)
                    .filter(Objects::nonNull)
                    .forEach(assignmentIds::add);
        }

        QueryWrapper<SysStudentGroup> groupWrapper = new QueryWrapper<>();
        groupWrapper.eq("user_id", studentId);
        List<SysStudentGroup> groups = sysStudentGroupMapper.selectList(groupWrapper);
        if (!CollectionUtils.isEmpty(groups)) {
            Set<Long> groupIds = groups.stream()
                    .map(SysStudentGroup::getGroupId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            if (!groupIds.isEmpty()) {
                QueryWrapper<AssessmentSubmission> submissionWrapper = new QueryWrapper<>();
                submissionWrapper.in("subject_id", groupIds)
                        .eq("subject_type", "GROUP");
                List<AssessmentSubmission> groupSubmissions = assessmentSubmissionMapper.selectList(submissionWrapper);
                if (!CollectionUtils.isEmpty(groupSubmissions)) {
                    groupSubmissions.stream()
                            .map(AssessmentSubmission::getAssignmentId)
                            .filter(Objects::nonNull)
                            .forEach(assignmentIds::add);
                }
            }
        }

        return assignmentIds;
    }

    private List<StudentResultOverviewDTO.Item> filterBySemester(List<StudentResultOverviewDTO.Item> items, String semester) {
        if (items.isEmpty()) {
            return items;
        }
        if (semester == null || "all".equalsIgnoreCase(semester.trim())) {
            return items;
        }

        if ("current".equalsIgnoreCase(semester.trim())) {
            LocalDate now = LocalDate.now(LOCAL_ZONE);
            int year = now.getYear();
            String semesterValue = determineCurrentSemesterValue(now);
            String expectedDisplay = formatSemester(year, semesterValue);
            return items.stream()
                    .filter(item -> expectedDisplay.equalsIgnoreCase(item.getSemester()))
                    .collect(Collectors.toList());
        }

        String target = semester.trim();
        return items.stream()
                .filter(item -> target.equalsIgnoreCase(item.getSemester()))
                .collect(Collectors.toList());
    }

    private List<StudentResultOverviewDTO.Item> applySorting(List<StudentResultOverviewDTO.Item> items, String sort) {
        if (items.isEmpty()) {
            return items;
        }
        String normalized = sort == null ? "date_desc" : sort.trim().toLowerCase(Locale.ROOT);

        Comparator<StudentResultOverviewDTO.Item> comparator;
        switch (normalized) {
            case "date_asc":
                comparator = Comparator.comparing(this::parseDateForSorting, Comparator.nullsFirst(Comparator.naturalOrder()));
                break;
            case "grade_desc":
                comparator = Comparator.comparing((StudentResultOverviewDTO.Item item) -> valueOrZero(item.getFinalScore().getPercentage()))
                        .reversed()
                        .thenComparing(StudentResultOverviewDTO.Item::getAssignmentName, Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "grade_asc":
                comparator = Comparator.comparing((StudentResultOverviewDTO.Item item) -> valueOrZero(item.getFinalScore().getPercentage()))
                        .thenComparing(StudentResultOverviewDTO.Item::getAssignmentName, Comparator.nullsLast(String::compareToIgnoreCase));
                break;
            case "date_desc":
            default:
                comparator = Comparator.comparing(this::parseDateForSorting, Comparator.nullsLast(Comparator.reverseOrder()));
                break;
        }

        return items.stream()
                .sorted(comparator)
                .collect(Collectors.toList());
    }

    private ZonedDateTime parseDateForSorting(StudentResultOverviewDTO.Item item) {
        ZonedDateTime releasedAt = parseIso(item.getReleasedAt());
        if (releasedAt != null) {
            return releasedAt;
        }
        return parseIso(item.getAssessedOn());
    }

    private ZonedDateTime parseIso(String iso) {
        if (!StringUtils.hasText(iso)) {
            return null;
        }
        try {
            return ZonedDateTime.parse(iso, ISO_FORMATTER);
        } catch (Exception ex) {
            return null;
        }
    }

    private AggregationPayload aggregateAssignmentResult(Assignment assignment, List<AssessmentSubmission> submissions) {
        if (CollectionUtils.isEmpty(submissions)) {
            return null;
        }

        RubricMetaInfo metaInfo = parseRubricMeta(assignment);
        String weightBasis = metaInfo != null && StringUtils.hasText(metaInfo.getWeightBasis())
                ? metaInfo.getWeightBasis()
                : "percentage";
        double totalPoints = metaInfo != null && metaInfo.getTotalPoints() != null
                ? metaInfo.getTotalPoints()
                : 100.0;

        Map<Long, String> examinerNames = loadExaminerNames(submissions);

        List<SubmissionAdapter> adapters = submissions.stream()
                .map(sub -> toSubmissionAdapter(sub, examinerNames))
                .collect(Collectors.toList());

        List<SectionDefinition> definitions = buildSections(assignment, metaInfo);
        boolean hasMixed = definitions.stream()
                .map(SectionDefinition::getSectionType)
                .collect(Collectors.toSet())
                .size() > 1;

        List<StudentResultDetailDTO.RubricSection> sections = new ArrayList<>();
        double aggregateTotal = 0.0;
        double aggregateMax = 0.0;

        for (SectionDefinition definition : definitions) {
            List<SubmissionAdapter> sectionSubmissions = adapters.stream()
                    .filter(adapter -> definition.getSubjectType().equalsIgnoreCase(adapter.getSubjectType()))
                    .collect(Collectors.toList());

            StudentResultDetailDTO.RubricSection sectionDto = new StudentResultDetailDTO.RubricSection();
            sectionDto.setSectionType(definition.getSectionType());
            sectionDto.setDisplayName(definition.getDisplayName());
            sectionDto.setWeightShare(definition.getWeightShare());

            double sectionTotal = 0.0;
            double sectionMax = 0.0;
            List<StudentResultDetailDTO.RubricCriterion> criteriaDtos = new ArrayList<>();

            if (!CollectionUtils.isEmpty(definition.getCriteria())) {
                for (RubricsInfoDto criterion : definition.getCriteria()) {
                    double maxPoints = resolveCriterionMaxPoints(criterion, definition, totalPoints, weightBasis);
                    sectionMax += maxPoints;

                    CriterionComputation computation = computeCriterion(criterion, definition, maxPoints, sectionSubmissions);
                    sectionTotal += computation.getFinalPoints();

                    StudentResultDetailDTO.RubricCriterion criterionDto = new StudentResultDetailDTO.RubricCriterion();
                    String criterionKey = buildCriterionKey(definition, criterion);
                    criterionDto.setCriterionId(criterionKey);
                    criterionDto.setName(criterion.getDescription());
                    criterionDto.setDescription(criterion.getDescription());
                    criterionDto.setWeight(criterion.getWeight());
                    criterionDto.setMaxPoints(roundOneDecimal(maxPoints));
                    criterionDto.setFinalPoints(roundOneDecimal(computation.getFinalPoints()));
                    criterionDto.setPercentage(roundOneDecimal(computation.getPercentage()));
                    criterionDto.setFinalLevelLabel(computation.getFinalLevelLabel());

                    List<StudentResultDetailDTO.RubricCriterionComment> commentDtos = computation.getComments().stream()
                            .sorted(Comparator
                                    .comparing(ExaminerComment::getSubmittedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                                    .thenComparing(comment -> formatExaminerLabel(comment.getExaminerId(), comment.getExaminerName())))
                            .map(comment -> {
                                StudentResultDetailDTO.RubricCriterionComment dto =
                                        new StudentResultDetailDTO.RubricCriterionComment();
                                dto.setExaminerId(comment.getExaminerId());
                                dto.setExaminerName(comment.getExaminerName());
                                dto.setComment(comment.getComment());
                                return dto;
                            })
                            .collect(Collectors.toList());
                    criterionDto.setCommentsByExaminer(commentDtos);
                    criterionDto.setCommentsCombined(combineComments(computation.getComments()));

                    criteriaDtos.add(criterionDto);
                }
            }

            sectionDto.setCriteria(criteriaDtos);
            sectionDto.setTotalPoints(roundOneDecimal(sectionTotal));
            sectionDto.setMaxPoints(roundOneDecimal(sectionMax));

            aggregateTotal += sectionTotal;
            aggregateMax += sectionMax;
            sections.add(sectionDto);
        }

        double percentage = aggregateMax > 0 ? (aggregateTotal / aggregateMax) * 100.0 : 0.0;

        ZonedDateTime latestSubmission = adapters.stream()
                .map(SubmissionAdapter::getSubmittedAt)
                .filter(Objects::nonNull)
                .max(ZonedDateTime::compareTo)
                .orElse(null);

        List<ExaminerComment> overallComments = buildOverallComments(adapters);
        Long primarySessionId = resolvePrimarySessionId(adapters);

        AggregationPayload payload = new AggregationPayload();
        payload.setMetaInfo(metaInfo);
        payload.setSections(sections);
        payload.setTotalPoints(aggregateTotal);
        payload.setMaxPoints(aggregateMax);
        payload.setPercentage(percentage);
        payload.setHasMixedRubric(hasMixed);
        payload.setLatestSubmissionTime(latestSubmission);
        payload.setOverallExaminerComments(overallComments);
        payload.setPrimarySessionId(primarySessionId);
        return payload;
    }

    private CriterionComputation computeCriterion(RubricsInfoDto criterion,
                                                  SectionDefinition sectionDefinition,
                                                  double maxPoints,
                                                  List<SubmissionAdapter> submissions) {
        double totalEarned = 0.0;
        int count = 0;
        Map<String, Integer> levelFrequency = new LinkedHashMap<>();
        List<ExaminerComment> comments = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        String key = normalizeKey(criterion.getDescription());

        for (SubmissionAdapter adapter : submissions) {
            SaveAssessmentDraftRequestDTO.ScoreItem scoreItem = adapter.getScores().get(key);
            if (scoreItem == null || scoreItem.getInputPoints() == null) {
                continue;
            }

            double normalized = clamp(scoreItem.getInputPoints());
            double earned = maxPoints * normalized / 100.0;
            totalEarned += earned;
            count++;

            if (scoreItem.getSelectedLevel() != null && StringUtils.hasText(scoreItem.getSelectedLevel().getDescription())) {
                levelFrequency.merge(scoreItem.getSelectedLevel().getDescription(), 1, Integer::sum);
            }

            if (StringUtils.hasText(scoreItem.getComment())) {
                String commentKey = adapter.getExaminerId() + "|" + key + "|" + scoreItem.getComment().trim();
                if (seen.add(commentKey)) {
                    comments.add(new ExaminerComment(
                            adapter.getExaminerId(),
                            adapter.getExaminerName(),
                            scoreItem.getComment().trim(),
                            adapter.getSubmittedAt()));
                }
            }
        }

        double finalPoints = count == 0 ? 0.0 : totalEarned / count;
        double percentage = maxPoints > 0 ? (finalPoints / maxPoints) * 100.0 : 0.0;
        String finalLevel = levelFrequency.entrySet().stream()
                .max(Map.Entry.<String, Integer>comparingByValue()
                        .thenComparing(Map.Entry.comparingByKey()))
                .map(Map.Entry::getKey)
                .orElse(null);

        CriterionComputation computation = new CriterionComputation();
        computation.setFinalPoints(finalPoints);
        computation.setPercentage(percentage);
        computation.setFinalLevelLabel(finalLevel);
        computation.setComments(comments);
        return computation;
    }

    private List<ExaminerComment> buildOverallComments(List<SubmissionAdapter> adapters) {
        List<ExaminerComment> results = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (SubmissionAdapter adapter : adapters) {
            if (!StringUtils.hasText(adapter.getOverallComment())) {
                continue;
            }
            String trimmed = adapter.getOverallComment().trim();
            String key = adapter.getExaminerId() + "|" + trimmed;
            if (seen.add(key)) {
                results.add(new ExaminerComment(
                        adapter.getExaminerId(),
                        adapter.getExaminerName(),
                        trimmed,
                        adapter.getSubmittedAt()));
            }
        }

        return results;
    }

    private Long resolvePrimarySessionId(List<SubmissionAdapter> adapters) {
        return adapters.stream()
                .filter(adapter -> adapter.getSessionId() != null)
                .max(Comparator.comparing(SubmissionAdapter::getSubmittedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(SubmissionAdapter::getSessionId)
                .orElse(null);
    }

    private List<SectionDefinition> buildSections(Assignment assignment, RubricMetaInfo metaInfo) {
        List<SectionDefinition> sections = new ArrayList<>();
        String assignmentType = normalizeAssignmentType(assignment.getType());

        if (metaInfo != null) {
            if (!CollectionUtils.isEmpty(metaInfo.getGroupRubrics())
                    && (metaInfo.getGroupWeight() == null || metaInfo.getGroupWeight() > 0)) {
                SectionDefinition group = new SectionDefinition();
                group.setSectionType("GROUP");
                group.setDisplayName("Group Rubric");
                group.setWeightShare(metaInfo.getGroupWeight());
                group.setCriteria(metaInfo.getGroupRubrics());
                group.setSubjectType("GROUP");
                sections.add(group);
            }

            if (!CollectionUtils.isEmpty(metaInfo.getIndividualRubrics())
                    && (metaInfo.getIndividualWeight() == null || metaInfo.getIndividualWeight() > 0)) {
                SectionDefinition individual = new SectionDefinition();
                individual.setSectionType("INDIVIDUAL");
                individual.setDisplayName("Individual Rubric");
                individual.setWeightShare(metaInfo.getIndividualWeight());
                individual.setCriteria(metaInfo.getIndividualRubrics());
                individual.setSubjectType("INDIVIDUAL");
                sections.add(individual);
            }
        }

        if (sections.isEmpty()) {
            SectionDefinition fallback = new SectionDefinition();
            boolean groupType = "group".equalsIgnoreCase(assignmentType);
            fallback.setSectionType(groupType ? "GROUP" : "INDIVIDUAL");
            fallback.setDisplayName(groupType ? "Group Rubric" : "Individual Rubric");
            fallback.setWeightShare(100.0);
            fallback.setSubjectType(fallback.getSectionType());
            fallback.setCriteria(parseRubricsInfo(assignment));
            sections.add(fallback);
        }

        return sections;
    }

    private RubricMetaInfo parseRubricMeta(Assignment assignment) {
        if (!StringUtils.hasText(assignment.getRubricMetaInfo())) {
            return null;
        }
        try {
            return objectMapper.readValue(assignment.getRubricMetaInfo(), RubricMetaInfo.class);
        } catch (Exception ex) {
            logger.warn("Failed to parse rubric meta info for assignment {}: {}", assignment.getId(), ex.getMessage());
            return null;
        }
    }

    private List<RubricsInfoDto> parseRubricsInfo(Assignment assignment) {
        if (!StringUtils.hasText(assignment.getRubricsInfo())) {
            return new ArrayList<>();
        }
        try {
            return RubricParser.parseRubricItems(objectMapper, assignment.getRubricsInfo());
        } catch (Exception ex) {
            logger.warn("Failed to parse rubrics info for assignment {}: {}", assignment.getId(), ex.getMessage());
            return new ArrayList<>();
        }
    }

    private double resolveCriterionMaxPoints(RubricsInfoDto criterion,
                                             SectionDefinition sectionDefinition,
                                             double totalPoints,
                                             String weightBasis) {
        Double weight = criterion.getWeight();
        if ("points".equalsIgnoreCase(weightBasis)) {
            if (weight != null) {
                return weight;
            }
            return resolveMaxPointsFromLevels(criterion).orElse(0.0);
        }

        double sectionShare = sectionDefinition.getWeightShare() != null ? sectionDefinition.getWeightShare() : 100.0;
        double criterionWeight = weight != null ? weight : 0.0;
        return totalPoints * (sectionShare / 100.0) * (criterionWeight / 100.0);
    }

    private Optional<Double> resolveMaxPointsFromLevels(RubricsInfoDto criterion) {
        if (CollectionUtils.isEmpty(criterion.getPerformanceLevel())) {
            return Optional.empty();
        }
        return criterion.getPerformanceLevel().stream()
                .map(level -> level.getEndPoint() != null ? level.getEndPoint() : level.getStartPoint())
                .filter(Objects::nonNull)
                .max(Double::compareTo);
    }

    private SubmissionAdapter toSubmissionAdapter(AssessmentSubmission submission, Map<Long, String> examinerNames) {
        Map<String, SaveAssessmentDraftRequestDTO.ScoreItem> scores = new HashMap<>();
        if (StringUtils.hasText(submission.getScoresJson())) {
            try {
                List<SaveAssessmentDraftRequestDTO.ScoreItem> raw = objectMapper.readValue(submission.getScoresJson(), SCORE_ITEM_LIST);
                for (SaveAssessmentDraftRequestDTO.ScoreItem score : raw) {
                    if (StringUtils.hasText(score.getDescription())) {
                        scores.put(normalizeKey(score.getDescription()), score);
                    }
                }
            } catch (Exception ex) {
                logger.warn("Failed to parse scoresJson for submission {}: {}", submission.getId(), ex.getMessage());
            }
        }

        ZonedDateTime submittedAt = submission.getSubmittedAt() != null
                ? submission.getSubmittedAt().atZone(LOCAL_ZONE).withZoneSameInstant(UTC)
                : null;

        SubmissionAdapter adapter = new SubmissionAdapter();
        adapter.setSubmissionId(submission.getId());
        adapter.setSubjectType(Optional.ofNullable(submission.getSubjectType()).orElse("INDIVIDUAL"));
        adapter.setSessionId(submission.getSessionId());
        adapter.setExaminerId(submission.getExaminerId());
        adapter.setExaminerName(formatExaminerLabel(submission.getExaminerId(), examinerNames.get(submission.getExaminerId())));
        adapter.setScores(scores);
        adapter.setOverallComment(submission.getOverallFeedback());
        adapter.setSubmittedAt(submittedAt);
        return adapter;
    }

    private Map<Long, String> loadExaminerNames(List<AssessmentSubmission> submissions) {
        Set<Long> examinerIds = submissions.stream()
                .map(AssessmentSubmission::getExaminerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (examinerIds.isEmpty()) {
            return new HashMap<>();
        }
        List<SysUser> examiners = sysUserMapper.selectBatchIds(examinerIds);
        return examiners.stream()
                .collect(Collectors.toMap(SysUser::getUserId, SysUser::getUserName));
    }

    private StudentResultDetailDTO.RubricDefinition buildRubricDefinition(RubricMetaInfo metaInfo) {
        StudentResultDetailDTO.RubricDefinition definition = new StudentResultDetailDTO.RubricDefinition();
        if (metaInfo == null) {
            return definition;
        }

        StudentResultDetailDTO.RubricDefinitionMeta meta = new StudentResultDetailDTO.RubricDefinitionMeta();
        meta.setName(metaInfo.getName());
        meta.setDescription(metaInfo.getDescription());
        meta.setTotalPoints(metaInfo.getTotalPoints());
        meta.setWeightBasis(metaInfo.getWeightBasis());
        meta.setIndividualWeight(metaInfo.getIndividualWeight());
        meta.setGroupWeight(metaInfo.getGroupWeight());
        definition.setMeta(meta);

        definition.setIndividualRubrics(convertMetaCriteria(metaInfo.getIndividualRubrics()));
        definition.setGroupRubrics(convertMetaCriteria(metaInfo.getGroupRubrics()));
        return definition;
    }

    private List<StudentResultDetailDTO.RubricMetaCriterion> convertMetaCriteria(List<RubricsInfoDto> criteria) {
        if (CollectionUtils.isEmpty(criteria)) {
            return null;
        }
        List<StudentResultDetailDTO.RubricMetaCriterion> result = new ArrayList<>();
        for (RubricsInfoDto criterion : criteria) {
            StudentResultDetailDTO.RubricMetaCriterion dto = new StudentResultDetailDTO.RubricMetaCriterion();
            dto.setDescription(criterion.getDescription());
            dto.setWeight(criterion.getWeight());
            dto.setScaleType(criterion.getScaleType());
            if (!CollectionUtils.isEmpty(criterion.getPerformanceLevel())) {
                List<StudentResultDetailDTO.PerformanceLevel> levels = new ArrayList<>();
                for (PerformanceDto level : criterion.getPerformanceLevel()) {
                    StudentResultDetailDTO.PerformanceLevel levelDto = new StudentResultDetailDTO.PerformanceLevel();
                    levelDto.setDescription(level.getDescription());
                    levelDto.setStartPoint(level.getStartPoint());
                    levelDto.setEndPoint(level.getEndPoint());
                    if (level.getPreDefinedComment() != null) {
                        levelDto.setPreDefinedComment(new ArrayList<>(level.getPreDefinedComment()));
                    }
                    levels.add(levelDto);
                }
                dto.setPerformanceLevel(levels);
            }
            result.add(dto);
        }
        return result;
    }

    private void ensureUserExists(Long studentId) {
        SysUser user = sysUserMapper.selectById(studentId);
        if (user == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
    }

    private void ensureAssignmentParticipation(Long studentId, Long assignmentId) {
        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId)
                .eq("user_id", studentId)
                .eq("role_id", UserRole.STUDENT.sort())
                .last("limit 1");
        AssignmentParticipant participant = assignmentParticipantMapper.selectOne(wrapper);
        if (participant == null) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }
    }

    private CourseInfo getCourseInfoFromAssignment(Assignment assignment) {
        CourseInfo info = new CourseInfo();
        if (assignment != null && assignment.getSubjectId() != null) {
            try {
                org.swen90017.oas.entity.Subject subject = subjectService.getSubjectById(assignment.getSubjectId());
                if (subject != null) {
                    info.setCourseCode(subject.getSubjectCode());
                    info.setCourseName(subject.getSubjectName());
                    info.setAcademicYear(subject.getAcademicYear());
                    info.setSemesterValue(subject.getSemester());
                    info.setSemester(formatSemester(subject.getAcademicYear(), subject.getSemester()));
                    return info;
                }
            } catch (Exception ex) {
                logger.warn("Failed to load subject info for assignment {}: {}", assignment.getId(), ex.getMessage());
            }
        }
        info.setCourseCode("Unknown");
        info.setCourseName("Unknown Course");
        info.setSemester("Unknown");
        return info;
    }

    private String formatSemester(Integer academicYear, String semesterValue) {
        if (academicYear == null || !StringUtils.hasText(semesterValue)) {
            return "Unknown";
        }
        String normalized = semesterValue.trim().toLowerCase(Locale.ROOT);
        String label;
        switch (normalized) {
            case "1":
                label = "Semester 1";
                break;
            case "2":
                label = "Semester 2";
                break;
            case "summer":
                label = "Summer";
                break;
            default:
                label = "Semester " + semesterValue;
        }
        return label + " " + academicYear;
    }

    private String determineCurrentSemesterValue(LocalDate date) {
        int month = date.getMonthValue();
        if (month >= 1 && month <= 6) {
            return "1";
        }
        if (month >= 7 && month <= 11) {
            return "2";
        }
        return "summer";
    }

    private String buildSessionLabel(SlotSession session) {
        if (session == null) {
            return null;
        }
        StringBuilder label = new StringBuilder();
        if (session.getSessionNumber() != null) {
            label.append("Session ").append(session.getSessionNumber());
        } else {
            label.append("Session ").append(session.getSessionId());
        }
        if (session.getStartAt() != null) {
            ZonedDateTime start = session.getStartAt().atZone(LOCAL_ZONE);
            label.append(" — ").append(start.toLocalDate());
        }
        return label.toString();
    }

    private String normalizeAssignmentType(String type) {
        if (!StringUtils.hasText(type)) {
            return "individual";
        }
        return type.trim().toLowerCase(Locale.ROOT);
    }

    private String buildCriterionKey(SectionDefinition section, RubricsInfoDto criterion) {
        return section.getSectionType() + ":" + normalizeKey(criterion.getDescription());
    }

    private String normalizeKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String formatExaminerLabel(Long examinerId, String examinerName) {
        if (StringUtils.hasText(examinerName)) {
            return examinerName;
        }
        if (examinerId != null) {
            return "Examiner " + examinerId;
        }
        return "Examiner";
    }

    private String combineComments(List<ExaminerComment> comments) {
        if (CollectionUtils.isEmpty(comments)) {
            return null;
        }
        return comments.stream()
                .sorted(Comparator
                        .comparing(ExaminerComment::getSubmittedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(comment -> formatExaminerLabel(comment.getExaminerId(), comment.getExaminerName())))
                .map(comment -> String.format("%s: %s",
                        formatExaminerLabel(comment.getExaminerId(), comment.getExaminerName()),
                        comment.getComment()))
                .collect(Collectors.joining("\n"));
    }

    private double clamp(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.min(100.0, Math.max(0.0, value));
    }

    private Double roundOneDecimal(Double value) {
        if (value == null) {
            return null;
        }
        return Math.round(value * 10.0) / 10.0;
    }

    private Double valueOrZero(Double value) {
        return value == null ? 0.0 : value;
    }

    private String calculateGrade(Double score, Double maxScore) {
        if (score == null || maxScore == null || maxScore <= 0) {
            return "N/A";
        }
        double percentage = (score / maxScore) * 100.0;
        if (percentage >= 80) return "H1";
        if (percentage >= 75) return "H2A";
        if (percentage >= 70) return "H2B";
        if (percentage >= 65) return "H3";
        if (percentage >= 50) return "P";
        return "N";
    }

    private String toIsoString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(LOCAL_ZONE).withZoneSameInstant(UTC).format(ISO_FORMATTER);
    }

    private String toIsoString(ZonedDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.withZoneSameInstant(UTC).format(ISO_FORMATTER);
    }

    private static class CourseInfo {
        private String courseCode;
        private String courseName;
        private String semester;
        private Integer academicYear;
        private String semesterValue;

        public String getCourseCode() {
            return courseCode;
        }

        public void setCourseCode(String courseCode) {
            this.courseCode = courseCode;
        }

        public String getCourseName() {
            return courseName;
        }

        public void setCourseName(String courseName) {
            this.courseName = courseName;
        }

        public String getSemester() {
            return semester;
        }

        public void setSemester(String semester) {
            this.semester = semester;
        }

        public Integer getAcademicYear() {
            return academicYear;
        }

        public void setAcademicYear(Integer academicYear) {
            this.academicYear = academicYear;
        }

        public String getSemesterValue() {
            return semesterValue;
        }

        public void setSemesterValue(String semesterValue) {
            this.semesterValue = semesterValue;
        }
    }

    private static class SectionDefinition {
        private String sectionType;
        private String displayName;
        private Double weightShare;
        private List<RubricsInfoDto> criteria;
        private String subjectType;

        public String getSectionType() {
            return sectionType;
        }

        public void setSectionType(String sectionType) {
            this.sectionType = sectionType;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public Double getWeightShare() {
            return weightShare;
        }

        public void setWeightShare(Double weightShare) {
            this.weightShare = weightShare;
        }

        public List<RubricsInfoDto> getCriteria() {
            return criteria;
        }

        public void setCriteria(List<RubricsInfoDto> criteria) {
            this.criteria = criteria;
        }

        public String getSubjectType() {
            return subjectType;
        }

        public void setSubjectType(String subjectType) {
            this.subjectType = subjectType;
        }
    }

    private static class SubmissionAdapter {
        private Long submissionId;
        private String subjectType;
        private Long sessionId;
        private Long examinerId;
        private String examinerName;
        private Map<String, SaveAssessmentDraftRequestDTO.ScoreItem> scores;
        private String overallComment;
        private ZonedDateTime submittedAt;

        public Long getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(Long submissionId) {
            this.submissionId = submissionId;
        }

        public String getSubjectType() {
            return subjectType;
        }

        public void setSubjectType(String subjectType) {
            this.subjectType = subjectType;
        }

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }

        public Long getExaminerId() {
            return examinerId;
        }

        public void setExaminerId(Long examinerId) {
            this.examinerId = examinerId;
        }

        public String getExaminerName() {
            return examinerName;
        }

        public void setExaminerName(String examinerName) {
            this.examinerName = examinerName;
        }

        public Map<String, SaveAssessmentDraftRequestDTO.ScoreItem> getScores() {
            return scores;
        }

        public void setScores(Map<String, SaveAssessmentDraftRequestDTO.ScoreItem> scores) {
            this.scores = scores;
        }

        public String getOverallComment() {
            return overallComment;
        }

        public void setOverallComment(String overallComment) {
            this.overallComment = overallComment;
        }

        public ZonedDateTime getSubmittedAt() {
            return submittedAt;
        }

        public void setSubmittedAt(ZonedDateTime submittedAt) {
            this.submittedAt = submittedAt;
        }
    }

    private static class ExaminerComment {
        private final Long examinerId;
        private final String examinerName;
        private final String comment;
        private final ZonedDateTime submittedAt;

        ExaminerComment(Long examinerId, String examinerName, String comment, ZonedDateTime submittedAt) {
            this.examinerId = examinerId;
            this.examinerName = examinerName;
            this.comment = comment;
            this.submittedAt = submittedAt;
        }

        public Long getExaminerId() {
            return examinerId;
        }

        public String getExaminerName() {
            return examinerName;
        }

        public String getComment() {
            return comment;
        }

        public ZonedDateTime getSubmittedAt() {
            return submittedAt;
        }
    }

    private static class CriterionComputation {
        private double finalPoints;
        private double percentage;
        private String finalLevelLabel;
        private List<ExaminerComment> comments = new ArrayList<>();

        public double getFinalPoints() {
            return finalPoints;
        }

        public void setFinalPoints(double finalPoints) {
            this.finalPoints = finalPoints;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }

        public String getFinalLevelLabel() {
            return finalLevelLabel;
        }

        public void setFinalLevelLabel(String finalLevelLabel) {
            this.finalLevelLabel = finalLevelLabel;
        }

        public List<ExaminerComment> getComments() {
            return comments;
        }

        public void setComments(List<ExaminerComment> comments) {
            this.comments = comments;
        }
    }

    private static class AggregationPayload {
        private RubricMetaInfo metaInfo;
        private List<StudentResultDetailDTO.RubricSection> sections;
        private double totalPoints;
        private double maxPoints;
        private double percentage;
        private boolean hasMixedRubric;
        private ZonedDateTime latestSubmissionTime;
        private List<ExaminerComment> overallExaminerComments;
        private Long primarySessionId;

        public RubricMetaInfo getMetaInfo() {
            return metaInfo;
        }

        public void setMetaInfo(RubricMetaInfo metaInfo) {
            this.metaInfo = metaInfo;
        }

        public List<StudentResultDetailDTO.RubricSection> getSections() {
            return sections;
        }

        public void setSections(List<StudentResultDetailDTO.RubricSection> sections) {
            this.sections = sections;
        }

        public double getTotalPoints() {
            return totalPoints;
        }

        public void setTotalPoints(double totalPoints) {
            this.totalPoints = totalPoints;
        }

        public double getMaxPoints() {
            return maxPoints;
        }

        public void setMaxPoints(double maxPoints) {
            this.maxPoints = maxPoints;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }

        public boolean isHasMixedRubric() {
            return hasMixedRubric;
        }

        public void setHasMixedRubric(boolean hasMixedRubric) {
            this.hasMixedRubric = hasMixedRubric;
        }

        public ZonedDateTime getLatestSubmissionTime() {
            return latestSubmissionTime;
        }

        public void setLatestSubmissionTime(ZonedDateTime latestSubmissionTime) {
            this.latestSubmissionTime = latestSubmissionTime;
        }

        public List<ExaminerComment> getOverallExaminerComments() {
            return overallExaminerComments;
        }

        public void setOverallExaminerComments(List<ExaminerComment> overallExaminerComments) {
            this.overallExaminerComments = overallExaminerComments;
        }

        public Long getPrimarySessionId() {
            return primarySessionId;
        }

        public void setPrimarySessionId(Long primarySessionId) {
            this.primarySessionId = primarySessionId;
        }
    }
}
