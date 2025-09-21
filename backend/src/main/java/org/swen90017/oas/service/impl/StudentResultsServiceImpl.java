package org.swen90017.oas.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.PerformanceDto;
import org.swen90017.oas.dto.RubricMetaInfo;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.SaveAssessmentDraftRequestDTO;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.AssessmentSubmission;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.service.StudentResultsService;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.utils.RubricParser;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentResultsServiceImpl implements StudentResultsService {

    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;
    private final ObjectMapper objectMapper;
    private final SubjectService subjectService;

    @Override
    public StudentResultOverviewDTO listStudentResults(Long studentId, String status, String semester, int pageNum, int pageSize, String sort, String ifModifiedSince) {
        ensureUserExists(studentId);

        // Query submitted assessments for the student
        String queryStatus = "released".equals(status) ? "SUBMITTED" : null;
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudent(studentId, null, queryStatus);
        
        // Handle empty submissions
        if (submissions == null || submissions.isEmpty()) {
            StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
            dto.setPageNum(pageNum);
            dto.setPageSize(pageSize);
            dto.setTotal(0L);
            dto.setData(new ArrayList<>());
            dto.setCachingHintSeconds(3600);
            return dto;
        }
        
        // Filter by assignment release status and convert to DTO format
        List<StudentResultOverviewDTO.Item> items = submissions.stream()
                .filter(sub -> {
                    Assignment assignment = assignmentMapper.selectById(sub.getAssignmentId());
                    return assignment != null;
                })
                .map(sub -> convertToOverviewItem(sub, studentId))
                .filter(Objects::nonNull) // Filter out any null items from conversion
                .collect(Collectors.toList());

        // Apply semester filtering
        if (semester != null && !"all".equals(semester) && !"current".equals(semester)) {
            items = items.stream()
                    .filter(item -> item != null && semester.equals(item.getSemester()))
                    .collect(Collectors.toList());
        }

        // Get total count before pagination
        long totalCount = items.size();

        // Apply sorting
        items = applySorting(items, sort);

        // Apply pagination
        List<StudentResultOverviewDTO.Item> paginatedItems;
        if (items.isEmpty()) {
            paginatedItems = new ArrayList<>();
        } else {
            int startIndex = (pageNum - 1) * pageSize;
            int endIndex = Math.min(startIndex + pageSize, items.size());
            
            // Ensure valid indices
            if (startIndex >= items.size()) {
                paginatedItems = new ArrayList<>(); // Return empty list if start index is beyond data
            } else {
                int safeStartIndex = Math.max(0, startIndex);
                int safeEndIndex = Math.max(safeStartIndex, Math.min(endIndex, items.size()));
                paginatedItems = items.subList(safeStartIndex, safeEndIndex);
            }
        }

        StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
        dto.setPageNum(pageNum);
        dto.setPageSize(pageSize);
        dto.setTotal(totalCount);
        dto.setData(paginatedItems);
        dto.setCachingHintSeconds(3600);
        return dto;
    }

    @Override
    public StudentResultSummaryDTO getAssignmentResultSummary(Long studentId, Long assignmentId, String ifModifiedSince) {
        ensureUserExists(studentId);
        //ensureAssignmentParticipation(studentId, assignmentId);

        // Guard: check release flag on assignment
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignmentWithGroups(studentId, assignmentId, "SUBMITTED");
        if (submissions.isEmpty()) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }

        StudentResultSummaryDTO response = new StudentResultSummaryDTO();
        
        // Get course information
        CourseInfo courseInfo = getCourseInfoFromAssignment(assignment);
        
        // Assignment info
        StudentResultSummaryDTO.AssignmentInfo assignmentInfo = new StudentResultSummaryDTO.AssignmentInfo();
        assignmentInfo.setAssignmentId(assignmentId);
        assignmentInfo.setAssignmentName(assignment.getName());
        assignmentInfo.setCourseCode(courseInfo.getCourseCode());
        assignmentInfo.setCourseName(courseInfo.getCourseName());
        assignmentInfo.setAssessmentType(assignment.getType());
        assignmentInfo.setSemester(courseInfo.getSemester());
        response.setAssignment(assignmentInfo);

        // Parse rubrics to get max points and criteria info
        RubricInfo rubricInfo = parseRubricInfo(assignment);

        // Calculate aggregated scores from all submissions
        AggregatedScores aggregatedScores = calculateAggregatedScores(submissions, rubricInfo);
        
        // Result info - using aggregated data from all submissions
        StudentResultSummaryDTO.ResultInfo resultInfo = new StudentResultSummaryDTO.ResultInfo();
        resultInfo.setResultId(submissions.get(0).getId()); // Use first submission ID as reference
        resultInfo.setFinalGrade(calculateGrade(aggregatedScores.getAverageTotalScore(), rubricInfo.getMaxPoints()));
        resultInfo.setPercentage(rubricInfo.getMaxPoints() > 0 ? 
            (aggregatedScores.getAverageTotalScore() / rubricInfo.getMaxPoints()) * 100.0 : 0.0);
        resultInfo.setTotalPoints(aggregatedScores.getAverageTotalScore());
        resultInfo.setMaxPoints(rubricInfo.getMaxPoints());
        resultInfo.setResultStatus("released");
        resultInfo.setAssessedOn(aggregatedScores.getLatestSubmissionTime());
        resultInfo.setReleasedOn(assignment.getReleasedAt() != null ? 
            assignment.getReleasedAt().atZone(ZoneId.of("UTC")) : null);
        resultInfo.setAggregationMethod("average");
        resultInfo.setExaminerCount(submissions.size());
        response.setResult(resultInfo);

        // Calculate highest and lowest criteria from submissions
        CriteriaAnalysis criteriaAnalysis = analyzeCriteria(submissions, rubricInfo.getRubricItems());

        // Summary info
        StudentResultSummaryDTO.SummaryInfo summaryInfo = new StudentResultSummaryDTO.SummaryInfo();
        summaryInfo.setCriteriaCount(rubricInfo.getRubricItems().size());
        summaryInfo.setHighestCriterion(criteriaAnalysis.getHighestCriterion());
        summaryInfo.setLowestCriterion(criteriaAnalysis.getLowestCriterion());
        summaryInfo.setFeedbackItemsCount(submissions.stream()
            .mapToInt(s -> s.getOverallFeedback() != null ? 1 : 0)
            .sum());
        response.setSummary(summaryInfo);
        
        return response;
    }

    @Override
    public StudentRubricBreakdownDTO getRubricBreakdown(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        //ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignmentWithGroups(studentId, assignmentId, "SUBMITTED");
        if (submissions.isEmpty()) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }

        // Parse rubrics info from assignment
        RubricInfo rubricInfo = parseRubricInfo(assignment);
        
        // Create detailed breakdown
        StudentRubricBreakdownDTO dto = new StudentRubricBreakdownDTO();
        dto.setResultId(submissions.get(0).getId());
        
        StudentRubricBreakdownDTO.RubricBreakdown rb = new StudentRubricBreakdownDTO.RubricBreakdown();
        rb.setAggregationMethod("average");
        
        // Build criteria breakdown
        List<StudentRubricBreakdownDTO.Criterion> criteria = new ArrayList<>();
        for (int i = 0; i < rubricInfo.getRubricItems().size(); i++) {
            RubricsInfoDto rubricItem = rubricInfo.getRubricItems().get(i);
            StudentRubricBreakdownDTO.Criterion criterion = new StudentRubricBreakdownDTO.Criterion();
            criterion.setCriterionId((long) i);
            criterion.setName(rubricItem.getDescription());
            criterion.setDescription(rubricItem.getDescription());
            criterion.setWeight(rubricItem.getWeight());
            criterion.setMaxPoints(getMaxPointsForCriterion(rubricItem));
            
            // Calculate average earned points from all submissions
            List<Double> earnedPoints = new ArrayList<>();
            List<StudentRubricBreakdownDTO.ExaminerScore> examinerScores = new ArrayList<>();
            List<String> comments = new ArrayList<>();
            
            for (AssessmentSubmission submission : submissions) {
                CriterionScore score = parseCriterionScore(submission, rubricItem.getDescription());
                if (score != null) {
                    earnedPoints.add(score.getPoints());
                    
                    StudentRubricBreakdownDTO.ExaminerScore examinerScore = new StudentRubricBreakdownDTO.ExaminerScore();
                    examinerScore.setExaminerId(submission.getExaminerId());
                    examinerScore.setExaminerName("Examiner " + submission.getExaminerId()); // TODO: get actual name
                    examinerScore.setPoints(score.getPoints());
                    examinerScore.setLevel(score.getLevel());
                    examinerScores.add(examinerScore);
                    
                    if (score.getComment() != null && !score.getComment().trim().isEmpty()) {
                        comments.add(score.getComment());
                    }
                }
            }
            
            // Calculate average earned points
            double avgEarnedPoints = earnedPoints.isEmpty() ? 0.0 : 
                earnedPoints.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            criterion.setEarnedPoints(avgEarnedPoints);
            criterion.setExaminerScores(examinerScores);
            criterion.setComments(comments);
            
            criteria.add(criterion);
        }
        
        rb.setCriteria(criteria);
        dto.setRubricBreakdown(rb);
        return dto;
    }

    @Override
    public StudentRubricScaleDTO getRubricScale(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        //ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
//        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
//            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
//        }

        // Parse rubrics info from assignment
        RubricInfo rubricInfo = parseRubricInfo(assignment);
        
        StudentRubricScaleDTO dto = new StudentRubricScaleDTO();
        List<StudentRubricScaleDTO.CriterionScale> criteria = new ArrayList<>();
        
        for (int i = 0; i < rubricInfo.getRubricItems().size(); i++) {
            RubricsInfoDto rubricItem = rubricInfo.getRubricItems().get(i);
            StudentRubricScaleDTO.CriterionScale criterionScale = new StudentRubricScaleDTO.CriterionScale();
            criterionScale.setCriterionId((long) i);
            
            List<StudentRubricScaleDTO.Level> levels = new ArrayList<>();
            if (rubricItem.getPerformanceLevel() != null) {
                for (PerformanceDto performance : rubricItem.getPerformanceLevel()) {
                    StudentRubricScaleDTO.Level level = new StudentRubricScaleDTO.Level();
                    level.setLabel(performance.getDescription());
                    // Use average of start and end points, or just the start point if end is null
                    Double points = performance.getStartPoint();
                    if (performance.getEndPoint() != null && performance.getStartPoint() != null) {
                        points = (performance.getStartPoint() + performance.getEndPoint()) / 2.0;
                    } else if (performance.getEndPoint() != null) {
                        points = performance.getEndPoint();
                    }
                    level.setPoints(points);
                    levels.add(level);
                }
            }
            
            criterionScale.setLevels(levels);
            criteria.add(criterionScale);
        }
        
        dto.setCriteria(criteria);
        return dto;
    }

    @Override
    public StudentExaminerFeedbackDTO getExaminerFeedback(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        //ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
//        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
//            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
//        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignmentWithGroups(studentId, assignmentId, "SUBMITTED");
        if (submissions.isEmpty()) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }

        // Convert submissions to examiner feedback
        List<StudentExaminerFeedbackDTO.ExaminerFeedback> examinerFeedbacks = submissions.stream()
                .map(this::convertToExaminerFeedback)
                .collect(Collectors.toList());

        StudentExaminerFeedbackDTO dto = new StudentExaminerFeedbackDTO();
        dto.setResultId(submissions.get(0).getId());
        dto.setExaminerFeedback(examinerFeedbacks);
        
        // Create consolidated feedback
        StudentExaminerFeedbackDTO.ConsolidatedFeedback cf = new StudentExaminerFeedbackDTO.ConsolidatedFeedback();
        cf.setStrengths(new ArrayList<>());
        cf.setImprovements(new ArrayList<>());
        dto.setConsolidatedFeedback(cf);
        
        return dto;
    }

    private void ensureUserExists(Long studentId) {
        SysUser student = sysUserMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
    }

    /**
     * Apply sorting to the list of student result items
     */
    private List<StudentResultOverviewDTO.Item> applySorting(List<StudentResultOverviewDTO.Item> items, String sort) {
        if (items == null || items.isEmpty()) {
            return new ArrayList<>(); // Return empty list if input is null or empty
        }
        
        if (sort == null || sort.isEmpty()) {
            sort = "date_desc"; // Default sorting
        }

        switch (sort.toLowerCase()) {
            case "date_desc":
                return items.stream()
                        .sorted((a, b) -> {
                            ZonedDateTime dateA = a.getResult() != null ? a.getResult().getAssessedOn() : null;
                            ZonedDateTime dateB = b.getResult() != null ? b.getResult().getAssessedOn() : null;
                            if (dateA == null && dateB == null) return 0;
                            if (dateA == null) return 1; // null dates go to end
                            if (dateB == null) return -1;
                            return dateB.compareTo(dateA); // descending
                        })
                        .collect(Collectors.toList());
                        
            case "date_asc":
                return items.stream()
                        .sorted((a, b) -> {
                            ZonedDateTime dateA = a.getResult() != null ? a.getResult().getAssessedOn() : null;
                            ZonedDateTime dateB = b.getResult() != null ? b.getResult().getAssessedOn() : null;
                            if (dateA == null && dateB == null) return 0;
                            if (dateA == null) return 1; // null dates go to end
                            if (dateB == null) return -1;
                            return dateA.compareTo(dateB); // ascending
                        })
                        .collect(Collectors.toList());
                        
            case "grade_desc":
                return items.stream()
                        .sorted((a, b) -> {
                            Double percentageA = a.getResult() != null ? a.getResult().getPercentage() : null;
                            Double percentageB = b.getResult() != null ? b.getResult().getPercentage() : null;
                            if (percentageA == null && percentageB == null) return 0;
                            if (percentageA == null) return 1; // null grades go to end
                            if (percentageB == null) return -1;
                            return Double.compare(percentageB, percentageA); // descending
                        })
                        .collect(Collectors.toList());
                        
            case "grade_asc":
                return items.stream()
                        .sorted((a, b) -> {
                            Double percentageA = a.getResult() != null ? a.getResult().getPercentage() : null;
                            Double percentageB = b.getResult() != null ? b.getResult().getPercentage() : null;
                            if (percentageA == null && percentageB == null) return 0;
                            if (percentageA == null) return 1; // null grades go to end
                            if (percentageB == null) return -1;
                            return Double.compare(percentageA, percentageB); // ascending
                        })
                        .collect(Collectors.toList());
                        
            case "name_asc":
                return items.stream()
                        .sorted((a, b) -> {
                            String nameA = a.getAssignmentName();
                            String nameB = b.getAssignmentName();
                            if (nameA == null && nameB == null) return 0;
                            if (nameA == null) return 1; // null names go to end
                            if (nameB == null) return -1;
                            return nameA.compareToIgnoreCase(nameB); // ascending, case insensitive
                        })
                        .collect(Collectors.toList());
                        
            case "name_desc":
                return items.stream()
                        .sorted((a, b) -> {
                            String nameA = a.getAssignmentName();
                            String nameB = b.getAssignmentName();
                            if (nameA == null && nameB == null) return 0;
                            if (nameA == null) return 1; // null names go to end
                            if (nameB == null) return -1;
                            return nameB.compareToIgnoreCase(nameA); // descending, case insensitive
                        })
                        .collect(Collectors.toList());
                        
            default:
                log.warn("Unknown sort parameter: {}, using default date_desc", sort);
                return applySorting(items, "date_desc");
        }
    }

    private void ensureAssignmentParticipation(Long studentId, Long assignmentId) {
        AssignmentParticipant rel = assignmentParticipantMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<AssignmentParticipant>()
                        .eq("assignment_id", assignmentId)
                        .eq("user_id", studentId)
                        .last("limit 1")
        );
        if (rel == null) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }
    }

    private StudentResultOverviewDTO.Item convertToOverviewItem(AssessmentSubmission submission, Long studentId) {
        if (submission == null) {
            return null;
        }
        
        try {
            Assignment assignment = assignmentMapper.selectById(submission.getAssignmentId());
            
            // Get course information
            CourseInfo courseInfo = getCourseInfoFromAssignment(assignment);
            
            StudentResultOverviewDTO.Item item = new StudentResultOverviewDTO.Item();
        item.setAssignmentId(submission.getAssignmentId());
        item.setAssignmentName(assignment != null ? assignment.getName() : "Unknown Assignment");
        item.setCourseCode(courseInfo.getCourseCode());
        item.setCourseName(courseInfo.getCourseName());
        item.setSemester(courseInfo.getSemester());
        item.setAssessmentType(assignment != null ? assignment.getType() : "UNKNOWN");
        
        // Get all submissions for this assignment and student to calculate aggregated scores
        List<AssessmentSubmission> allSubmissions = assessmentSubmissionMapper.listByStudentAndAssignmentWithGroups(
            studentId, submission.getAssignmentId(), "SUBMITTED");
        
        // Parse rubrics to get correct max points
        Double maxPoints = 100.0;
        AggregatedScores aggregatedScores = null;
        if (assignment != null) {
            RubricInfo rubricInfo = parseRubricInfo(assignment);
            maxPoints = rubricInfo.getMaxPoints();
            
            // Calculate aggregated scores from all submissions
            aggregatedScores = calculateAggregatedScores(allSubmissions, rubricInfo);
        }
        
        StudentResultOverviewDTO.ResultSummary result = new StudentResultOverviewDTO.ResultSummary();
        result.setResultId(submission.getId());
        
        // Use aggregated scores if available, otherwise fall back to single submission
        Double finalScore = aggregatedScores != null ? aggregatedScores.getAverageTotalScore() : submission.getTotalScore();
        result.setFinalGrade(calculateGrade(finalScore, maxPoints));
        result.setPercentage(maxPoints > 0 ? (finalScore / maxPoints) * 100.0 : 0.0);
        result.setTotalPoints(finalScore);
        result.setMaxPoints(maxPoints);
        result.setResultStatus("released");
        
        // Use latest submission time if available
        java.time.ZonedDateTime assessedTime = aggregatedScores != null && aggregatedScores.getLatestSubmissionTime() != null ?
            aggregatedScores.getLatestSubmissionTime() :
            (submission.getSubmittedAt() != null ? submission.getSubmittedAt().atZone(ZoneId.of("UTC")) : null);
        result.setAssessedOn(assessedTime);
        
        result.setReleasedOn(assignment != null && assignment.getReleasedAt() != null ? 
            assignment.getReleasedAt().atZone(ZoneId.of("UTC")) : null);
        item.setResult(result);
        
        // Check if any submission has detailed feedback
        boolean hasDetailedFeedback = allSubmissions.stream()
            .anyMatch(sub -> sub.getOverallFeedback() != null && !sub.getOverallFeedback().trim().isEmpty());
            item.setHasDetailedFeedback(hasDetailedFeedback);
            
            return item;
        } catch (Exception e) {
            log.warn("Error converting assessment submission {} to overview item: {}", 
                     submission.getId(), e.getMessage());
            return null; // Return null so it can be filtered out
        }
    }

    private String calculateGrade(Double score, Double maxScore) {
        if (score == null || maxScore == null || maxScore == 0) {
            return "N/A";
        }
        
        double percentage = (score / maxScore) * 100;
        
        if (percentage >= 90) return "A+";
        if (percentage >= 85) return "A";
        if (percentage >= 80) return "A-";
        if (percentage >= 75) return "B+";
        if (percentage >= 70) return "B";
        if (percentage >= 65) return "B-";
        if (percentage >= 60) return "C+";
        if (percentage >= 55) return "C";
        if (percentage >= 50) return "C-";
        if (percentage >= 40) return "D";
        return "F";
    }

    private StudentExaminerFeedbackDTO.ExaminerFeedback convertToExaminerFeedback(AssessmentSubmission submission) {
        StudentExaminerFeedbackDTO.ExaminerFeedback feedback = new StudentExaminerFeedbackDTO.ExaminerFeedback();
        feedback.setExaminerId(submission.getExaminerId());
        feedback.setExaminerName("Examiner " + submission.getExaminerId()); // TODO: get actual examiner name
        feedback.setOverallComment(submission.getOverallFeedback());
        feedback.setSubmittedOn(submission.getSubmittedAt() != null ? 
            submission.getSubmittedAt().atZone(ZoneId.of("UTC")) : null);
        
        // Parse criterion feedback from scoresJson
        List<StudentExaminerFeedbackDTO.CriterionFeedback> criterionFeedbacks = new ArrayList<>();
        if (submission.getScoresJson() != null && !submission.getScoresJson().trim().isEmpty()) {
            try {
                List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(
                    submission.getScoresJson(), 
                    new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {}
                );
                
                for (SaveAssessmentDraftRequestDTO.ScoreItem score : scores) {
                    if (score.getComment() != null && !score.getComment().trim().isEmpty()) {
                        StudentExaminerFeedbackDTO.CriterionFeedback criterionFeedback = 
                            new StudentExaminerFeedbackDTO.CriterionFeedback();
                        criterionFeedback.setCriterionName(score.getDescription());
                        criterionFeedback.setComment(score.getComment());
                        criterionFeedbacks.add(criterionFeedback);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse scoresJson for examiner feedback: {}", e.getMessage());
            }
        }
        
        feedback.setCriterionFeedback(criterionFeedbacks);
        return feedback;
    }
    
    /**
     * Parse rubric information from assignment
     */
    private RubricInfo parseRubricInfo(Assignment assignment) {
        RubricInfo info = new RubricInfo();
        
        try {
            // Parse rubric meta info
            if (assignment.getRubricMetaInfo() != null && !assignment.getRubricMetaInfo().trim().isEmpty()) {
                RubricMetaInfo metaInfo = objectMapper.readValue(assignment.getRubricMetaInfo(), RubricMetaInfo.class);
                info.setMetaInfo(metaInfo);
                info.setMaxPoints(metaInfo.getTotalPoints() != null ? metaInfo.getTotalPoints() : 100.0);
            } else {
                info.setMaxPoints(100.0); // default
            }
            
            // Parse rubrics info
            if (assignment.getRubricsInfo() != null && !assignment.getRubricsInfo().trim().isEmpty()) {
                List<RubricsInfoDto> rubricItems = RubricParser.parseRubricItems(objectMapper, assignment.getRubricsInfo());
                info.setRubricItems(rubricItems);
                
                // If no total points in meta info, calculate from rubric items
                if (info.getMaxPoints() == 100.0 && !rubricItems.isEmpty()) {
                    double calculatedMax = rubricItems.stream()
                        .mapToDouble(item -> getMaxPointsForCriterion(item))
                        .sum();
                    if (calculatedMax > 0) {
                        info.setMaxPoints(calculatedMax);
                    }
                }
            } else {
                info.setRubricItems(new ArrayList<>());
            }
        } catch (Exception e) {
            log.warn("Failed to parse rubric info: {}", e.getMessage());
            info.setMaxPoints(100.0);
            info.setRubricItems(new ArrayList<>());
        }
        
        return info;
    }
    
    /**
     * Get max points for a specific criterion
     */
    private Double getMaxPointsForCriterion(RubricsInfoDto rubricItem) {
        if (rubricItem.getPerformanceLevel() != null && !rubricItem.getPerformanceLevel().isEmpty()) {
            // For descriptive scale, find the highest end point
            return rubricItem.getPerformanceLevel().stream()
                .mapToDouble(p -> p.getEndPoint() != null ? p.getEndPoint() : 
                    (p.getStartPoint() != null ? p.getStartPoint() : 0.0))
                .max()
                .orElse(100.0);
        }
        // For points scale, assume 100 as default max
        return 100.0;
    }
    
    /**
     * Calculate total score from rubric items and score items using weighted average
     * This follows the same logic as AssessmentServiceImpl.computeTotalScore
     */
    private Double calculateTotalScoreFromRubrics(List<RubricsInfoDto> rubricItems, List<SaveAssessmentDraftRequestDTO.ScoreItem> scoreItems) {
        if (rubricItems == null || rubricItems.isEmpty() || scoreItems == null || scoreItems.isEmpty()) {
            return 0.0;
        }
        
        double total = 0.0;
        
        for (RubricsInfoDto rubricItem : rubricItems) {
            double weight = rubricItem.getWeight() != null ? rubricItem.getWeight() : 0.0;
            
            // Find matching score item
            SaveAssessmentDraftRequestDTO.ScoreItem matchedScore = scoreItems.stream()
                .filter(score -> rubricItem.getDescription() != null && rubricItem.getDescription().trim()
                    .equalsIgnoreCase(score.getDescription() == null ? "" : score.getDescription().trim()))
                .findFirst()
                .orElse(null);
                
            double normalizedScore = 0.0;
            if (matchedScore != null) {
                String scaleType = rubricItem.getScaleType();
                if ("points".equalsIgnoreCase(scaleType) || "percentage".equalsIgnoreCase(scaleType)) {
                    // For points/percentage scale
                    if (matchedScore.getInputPoints() != null) {
                        normalizedScore = Math.max(0.0, Math.min(100.0, matchedScore.getInputPoints()));
                    }
                } else if ("descriptive".equalsIgnoreCase(scaleType)) {
                    // For descriptive scale - prioritize inputPoints if available and valid
                    if (matchedScore.getInputPoints() != null) {
                        // Check if inputPoints is within selectedLevel range if both are provided
                        if (matchedScore.getSelectedLevel() != null) {
                            Double startPoint = matchedScore.getSelectedLevel().getStartPoint();
                            Double endPoint = matchedScore.getSelectedLevel().getEndPoint();
                            Double inputPoints = matchedScore.getInputPoints();
                            
                            if (startPoint != null && endPoint != null && 
                                inputPoints >= startPoint && inputPoints <= endPoint) {
                                normalizedScore = inputPoints;
                            } else if (startPoint != null && endPoint != null) {
                                // Use midpoint if inputPoints is outside range
                                normalizedScore = (startPoint + endPoint) / 2.0;
                                log.debug("InputPoints {} outside range [{}, {}] for {}, using midpoint", 
                                    inputPoints, startPoint, endPoint, rubricItem.getDescription());
                            } else {
                                normalizedScore = Math.max(0.0, Math.min(100.0, inputPoints));
                            }
                        } else {
                            normalizedScore = Math.max(0.0, Math.min(100.0, matchedScore.getInputPoints()));
                        }
                    } else if (matchedScore.getSelectedLevel() != null) {
                        // Only selectedLevel provided
                        Double startPoint = matchedScore.getSelectedLevel().getStartPoint();
                        Double endPoint = matchedScore.getSelectedLevel().getEndPoint();
                        if (startPoint != null && endPoint != null) {
                            normalizedScore = (startPoint + endPoint) / 2.0;
                        } else if (startPoint != null) {
                            normalizedScore = startPoint;
                        } else if (endPoint != null) {
                            normalizedScore = endPoint;
                        }
                    }
                }
            }
            
            total += normalizedScore * weight / 100.0;
        }
        
        return total;
    }
    
    /**
     * Validate score consistency between rubric definitions and score items
     * This helps identify potential issues with scoring data
     */
    private void validateScoreConsistency(List<RubricsInfoDto> rubricItems, List<SaveAssessmentDraftRequestDTO.ScoreItem> scoreItems) {
        if (rubricItems == null || scoreItems == null) {
            return;
        }
        
        for (RubricsInfoDto rubricItem : rubricItems) {
            SaveAssessmentDraftRequestDTO.ScoreItem matchedScore = scoreItems.stream()
                .filter(score -> rubricItem.getDescription() != null && rubricItem.getDescription().trim()
                    .equalsIgnoreCase(score.getDescription() == null ? "" : score.getDescription().trim()))
                .findFirst()
                .orElse(null);
                
            if (matchedScore != null) {
                String rubricScaleType = rubricItem.getScaleType();
                String scoreScaleType = matchedScore.getScaleType();
                
                // Check scale type consistency
                if (!isScaleTypeCompatible(rubricScaleType, scoreScaleType)) {
                    log.warn("Scale type mismatch for criterion '{}': rubric={}, score={}", 
                        rubricItem.getDescription(), rubricScaleType, scoreScaleType);
                }
                
                // For descriptive scale, validate selectedLevel against performance levels
                if ("descriptive".equalsIgnoreCase(rubricScaleType) && matchedScore.getSelectedLevel() != null) {
                    boolean levelExists = rubricItem.getPerformanceLevel() != null && 
                        rubricItem.getPerformanceLevel().stream()
                            .anyMatch(level -> level.getDescription() != null && 
                                level.getDescription().equals(matchedScore.getSelectedLevel().getDescription()) &&
                                Objects.equals(level.getStartPoint(), matchedScore.getSelectedLevel().getStartPoint()) &&
                                Objects.equals(level.getEndPoint(), matchedScore.getSelectedLevel().getEndPoint()));
                                
                    if (!levelExists) {
                        log.warn("Selected level '{}' not found in rubric performance levels for criterion '{}'", 
                            matchedScore.getSelectedLevel().getDescription(), rubricItem.getDescription());
                    }
                }
                
                // Validate inputPoints range for descriptive scale with selectedLevel
                if ("descriptive".equalsIgnoreCase(rubricScaleType) && 
                    matchedScore.getInputPoints() != null && matchedScore.getSelectedLevel() != null) {
                    Double inputPoints = matchedScore.getInputPoints();
                    Double startPoint = matchedScore.getSelectedLevel().getStartPoint();
                    Double endPoint = matchedScore.getSelectedLevel().getEndPoint();
                    
                    if (startPoint != null && endPoint != null && 
                        (inputPoints < startPoint || inputPoints > endPoint)) {
                        log.warn("InputPoints {} is outside selectedLevel range [{}, {}] for criterion '{}'", 
                            inputPoints, startPoint, endPoint, rubricItem.getDescription());
                    }
                }
            }
        }
    }
    
    /**
     * Check if scale types are compatible (following AssessmentServiceImpl logic)
     */
    private boolean isScaleTypeCompatible(String rubricType, String scoreType) {
        if (rubricType == null || scoreType == null) {
            return false;
        }
        
        // Normalize scale types
        String normalizedRubricType = normalizeScaleType(rubricType);
        String normalizedScoreType = normalizeScaleType(scoreType);
        
        return normalizedRubricType.equalsIgnoreCase(normalizedScoreType);
    }
    
    /**
     * Normalize scale type (percentage -> points)
     */
    private String normalizeScaleType(String scaleType) {
        if ("percentage".equalsIgnoreCase(scaleType)) {
            return "points";
        }
        return scaleType;
    }
    
    /**
     * Get course information from assignment
     */
    private CourseInfo getCourseInfoFromAssignment(Assignment assignment) {
        CourseInfo courseInfo = new CourseInfo();
        
        if (assignment != null && assignment.getSubjectId() != null) {
            try {
                org.swen90017.oas.entity.Subject subject = subjectService.getSubjectById(assignment.getSubjectId());
                if (subject != null) {
                    courseInfo.setCourseCode(subject.getSubjectCode());
                    courseInfo.setCourseName(subject.getSubjectName());
                    courseInfo.setSemester(formatSemester(subject.getAcademicYear(), subject.getSemester()));
                    courseInfo.setAcademicYear(subject.getAcademicYear());
                    courseInfo.setSemesterValue(subject.getSemester());
                }
            } catch (Exception e) {
                log.warn("Failed to get subject information for assignment {}: {}", assignment.getId(), e.getMessage());
                // Set default values if subject retrieval fails
                courseInfo.setCourseCode("Unknown");
                courseInfo.setCourseName("Course Unavailable");
                courseInfo.setSemester("Unknown");
            }
        } else {
            // Set default values if assignment or subjectId is null
            courseInfo.setCourseCode("Unknown");
            courseInfo.setCourseName("Unknown Assignment");
            courseInfo.setSemester("Unknown");
        }
        
        return courseInfo;
    }
    
    /**
     * Format semester display string
     */
    private String formatSemester(Integer academicYear, String semester) {
        if (academicYear == null || semester == null) {
            return "Unknown";
        }
        
        String semesterName;
        switch (semester.toLowerCase()) {
            case "1":
                semesterName = "Semester 1";
                break;
            case "2":
                semesterName = "Semester 2";
                break;
            case "summer":
                semesterName = "Summer";
                break;
            default:
                semesterName = "Semester " + semester;
        }
        
        return semesterName + " " + academicYear;
    }
    
    /**
     * Parse criterion score from assessment submission
     */
    private CriterionScore parseCriterionScore(AssessmentSubmission submission, String criterionDescription) {
        if (submission.getScoresJson() == null || submission.getScoresJson().trim().isEmpty()) {
            return null;
        }
        
        try {
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scores = objectMapper.readValue(
                submission.getScoresJson(), 
                new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>() {}
            );
            
            SaveAssessmentDraftRequestDTO.ScoreItem matchedScore = scores.stream()
                .filter(score -> criterionDescription != null && criterionDescription.trim()
                    .equalsIgnoreCase(score.getDescription() == null ? "" : score.getDescription().trim()))
                .findFirst()
                .orElse(null);
                
            if (matchedScore != null) {
                CriterionScore criterionScore = new CriterionScore();
                criterionScore.setComment(matchedScore.getComment());
                
                // Handle different scale types with improved logic
                String scaleType = matchedScore.getScaleType();
                if ("points".equalsIgnoreCase(scaleType) || "percentage".equalsIgnoreCase(scaleType)) {
                    // For points/percentage scale, use inputPoints directly
                    if (matchedScore.getInputPoints() != null) {
                        criterionScore.setPoints(Math.max(0.0, Math.min(100.0, matchedScore.getInputPoints())));
                    }
                } else if ("descriptive".equalsIgnoreCase(scaleType)) {
                    // For descriptive scale, handle both inputPoints and selectedLevel
                    if (matchedScore.getInputPoints() != null && matchedScore.getSelectedLevel() != null) {
                        // When both are provided, validate that inputPoints is within selectedLevel range
                        Double inputPoints = matchedScore.getInputPoints();
                        Double startPoint = matchedScore.getSelectedLevel().getStartPoint();
                        Double endPoint = matchedScore.getSelectedLevel().getEndPoint();
                        
                        if (startPoint != null && endPoint != null) {
                            // Validate that inputPoints is within the selected level range
                            if (inputPoints >= startPoint && inputPoints <= endPoint) {
                                criterionScore.setPoints(inputPoints);
                            } else {
                                // If inputPoints is outside the range, use the midpoint of selectedLevel
                                criterionScore.setPoints((startPoint + endPoint) / 2.0);
                                log.warn("InputPoints {} is outside selectedLevel range [{}, {}], using midpoint", 
                                    inputPoints, startPoint, endPoint);
                            }
                        } else {
                            criterionScore.setPoints(inputPoints);
                        }
                        criterionScore.setLevel(matchedScore.getSelectedLevel().getDescription());
                    } else if (matchedScore.getInputPoints() != null) {
                        // Only inputPoints provided for descriptive scale
                        criterionScore.setPoints(Math.max(0.0, Math.min(100.0, matchedScore.getInputPoints())));
                    } else if (matchedScore.getSelectedLevel() != null) {
                        // Only selectedLevel provided
                        Double startPoint = matchedScore.getSelectedLevel().getStartPoint();
                        Double endPoint = matchedScore.getSelectedLevel().getEndPoint();
                        if (startPoint != null && endPoint != null) {
                            criterionScore.setPoints((startPoint + endPoint) / 2.0);
                        } else if (startPoint != null) {
                            criterionScore.setPoints(startPoint);
                        } else if (endPoint != null) {
                            criterionScore.setPoints(endPoint);
                        }
                        criterionScore.setLevel(matchedScore.getSelectedLevel().getDescription());
                    }
                }
                
                return criterionScore;
            }
        } catch (Exception e) {
            log.warn("Failed to parse criterion score: {}", e.getMessage());
        }
        
        return null;
    }
    
    /**
     * Analyze criteria to find highest and lowest performing ones
     */
    private CriteriaAnalysis analyzeCriteria(List<AssessmentSubmission> submissions, List<RubricsInfoDto> rubricItems) {
        CriteriaAnalysis analysis = new CriteriaAnalysis();
        
        if (rubricItems.isEmpty()) {
            return analysis;
        }
        
        String highestCriterion = null;
        String lowestCriterion = null;
        double highestAvg = Double.MIN_VALUE;
        double lowestAvg = Double.MAX_VALUE;
        
        for (RubricsInfoDto rubricItem : rubricItems) {
            List<Double> scores = new ArrayList<>();
            
            for (AssessmentSubmission submission : submissions) {
                CriterionScore score = parseCriterionScore(submission, rubricItem.getDescription());
                if (score != null && score.getPoints() != null) {
                    scores.add(score.getPoints());
                }
            }
            
            if (!scores.isEmpty()) {
                double avgScore = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                
                if (avgScore > highestAvg) {
                    highestAvg = avgScore;
                    highestCriterion = rubricItem.getDescription();
                }
                
                if (avgScore < lowestAvg) {
                    lowestAvg = avgScore;
                    lowestCriterion = rubricItem.getDescription();
                }
            }
        }
        
        analysis.setHighestCriterion(highestCriterion);
        analysis.setLowestCriterion(lowestCriterion);
        return analysis;
    }
    
    /**
     * Calculate aggregated scores from all submissions
     */
    private AggregatedScores calculateAggregatedScores(List<AssessmentSubmission> submissions, RubricInfo rubricInfo) {
        AggregatedScores aggregated = new AggregatedScores();
        
        if (submissions.isEmpty()) {
            aggregated.setAverageTotalScore(0.0);
            return aggregated;
        }
        
        // Calculate average total score
        List<Double> totalScores = submissions.stream()
            .map(AssessmentSubmission::getTotalScore)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
            
        double averageTotal = totalScores.isEmpty() ? 0.0 : 
            totalScores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        aggregated.setAverageTotalScore(averageTotal);
        
        // Find latest submission time
        java.time.ZonedDateTime latestTime = submissions.stream()
            .map(AssessmentSubmission::getSubmittedAt)
            .filter(Objects::nonNull)
            .max(java.time.LocalDateTime::compareTo)
            .map(time -> time.atZone(ZoneId.of("UTC")))
            .orElse(null);
        aggregated.setLatestSubmissionTime(latestTime);
        
        // Calculate criterion-level averages
        if (rubricInfo.getRubricItems() != null && !rubricInfo.getRubricItems().isEmpty()) {
            List<AggregatedScores.CriterionAverage> criterionAverages = new ArrayList<>();
            
            for (RubricsInfoDto rubricItem : rubricInfo.getRubricItems()) {
                List<Double> criterionScores = new ArrayList<>();
                
                for (AssessmentSubmission submission : submissions) {
                    CriterionScore score = parseCriterionScore(submission, rubricItem.getDescription());
                    if (score != null && score.getPoints() != null) {
                        criterionScores.add(score.getPoints());
                    }
                }
                
                if (!criterionScores.isEmpty()) {
                    double avgScore = criterionScores.stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);
                        
                    AggregatedScores.CriterionAverage criterionAvg = new AggregatedScores.CriterionAverage();
                    criterionAvg.setCriterionName(rubricItem.getDescription());
                    criterionAvg.setAverageScore(avgScore);
                    criterionAvg.setSubmissionCount(criterionScores.size());
                    criterionAverages.add(criterionAvg);
                }
            }
            
            aggregated.setCriterionAverages(criterionAverages);
        }
        
        return aggregated;
    }
    
    /**
     * Demonstration method showing how the scoring logic works with the provided example
     * This method can be used for testing and validation purposes
     */
    private void demonstrateScoring() {
        // Example rubric definition from user
        String rubricsJson = "[{\"weight\": 50.0, \"scaleType\": \"points\", \"description\": \"Communication Skills1\", \"performanceLevel\": [{\"endPoint\": 100.0, \"startPoint\": 85.0, \"description\": \"Excellent\"}, {\"endPoint\": 84.0, \"startPoint\": 70.0, \"description\": \"Good\"}, {\"endPoint\": 69.0, \"startPoint\": 60.0, \"description\": \"Medium\"}]}, {\"weight\": 50.0, \"scaleType\": \"descriptive\", \"description\": \"New Criterion1\", \"performanceLevel\": [{\"endPoint\": 89.0, \"startPoint\": 80.0, \"description\": \"Very Good\"}, {\"endPoint\": 79.0, \"startPoint\": 70.0, \"description\": \"Good\"}, {\"endPoint\": 69.0, \"startPoint\": 60.0, \"description\": \"Satisfactory\"}, {\"endPoint\": 59.0, \"startPoint\": 0.0, \"description\": \"Needs Improvement\"}]}]";
        
        // Example score submission from user  
        String scoresJson = "[{\"weight\": 50.0, \"comment\": \"Well done\", \"scaleType\": \"points\", \"description\": \"Communication Skills1\", \"inputPoints\": 90.0, \"selectedLevel\": null}, {\"weight\": 50.0, \"comment\": \"Pass\", \"scaleType\": \"descriptive\", \"description\": \"New Criterion1\", \"inputPoints\": 75.0, \"selectedLevel\": {\"endPoint\": 69.0, \"startPoint\": 60.0, \"description\": \"Satisfactory\"}}]";
        
        try {
            // Parse rubrics and scores
            List<RubricsInfoDto> rubricItems = RubricParser.parseRubricItems(objectMapper, rubricsJson);
            List<SaveAssessmentDraftRequestDTO.ScoreItem> scoreItems = objectMapper.readValue(scoresJson, new TypeReference<List<SaveAssessmentDraftRequestDTO.ScoreItem>>(){});
            
            // Validate consistency
            validateScoreConsistency(rubricItems, scoreItems);
            
            // Calculate total score
            Double totalScore = calculateTotalScoreFromRubrics(rubricItems, scoreItems);
            
            log.info("=== Scoring Demonstration ===");
            log.info("Rubrics: {}", rubricsJson);
            log.info("Scores: {}", scoresJson);
            log.info("Calculated Total Score: {}", totalScore);
            
            // Breakdown by criterion
            for (int i = 0; i < rubricItems.size(); i++) {
                RubricsInfoDto rubric = rubricItems.get(i);
                SaveAssessmentDraftRequestDTO.ScoreItem score = scoreItems.get(i);
                
                double normalizedScore = 0.0;
                String explanation = "";
                
                if ("points".equalsIgnoreCase(rubric.getScaleType())) {
                    normalizedScore = score.getInputPoints();
                    explanation = String.format("Direct points: %.1f", normalizedScore);
                } else if ("descriptive".equalsIgnoreCase(rubric.getScaleType())) {
                    if (score.getInputPoints() != null && score.getSelectedLevel() != null) {
                        Double inputPoints = score.getInputPoints();
                        Double startPoint = score.getSelectedLevel().getStartPoint();
                        Double endPoint = score.getSelectedLevel().getEndPoint();
                        
                        if (inputPoints >= startPoint && inputPoints <= endPoint) {
                            normalizedScore = inputPoints;
                            explanation = String.format("InputPoints %.1f within range [%.1f, %.1f]", inputPoints, startPoint, endPoint);
                        } else {
                            normalizedScore = (startPoint + endPoint) / 2.0;
                            explanation = String.format("InputPoints %.1f outside range [%.1f, %.1f], using midpoint %.1f", inputPoints, startPoint, endPoint, normalizedScore);
                        }
                    }
                }
                
                double weightedScore = normalizedScore * rubric.getWeight() / 100.0;
                log.info("Criterion '{}': {} -> Weighted Score: {:.2f} (weight: {}%)", 
                    rubric.getDescription(), explanation, weightedScore, rubric.getWeight());
            }
            
            log.info("Expected calculation: (90.0 * 50/100) + (64.5 * 50/100) = 45.0 + 32.25 = 77.25");
            log.info("Note: For 'New Criterion1', inputPoints 75.0 is outside Satisfactory range [60.0, 69.0], so midpoint 64.5 is used");
            
        } catch (Exception e) {
            log.error("Error in scoring demonstration: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Helper class to hold rubric information
     */
    private static class RubricInfo {
        private RubricMetaInfo metaInfo;
        private List<RubricsInfoDto> rubricItems;
        private Double maxPoints;
        
        public RubricMetaInfo getMetaInfo() { return metaInfo; }
        public void setMetaInfo(RubricMetaInfo metaInfo) { this.metaInfo = metaInfo; }
        
        public List<RubricsInfoDto> getRubricItems() { return rubricItems; }
        public void setRubricItems(List<RubricsInfoDto> rubricItems) { this.rubricItems = rubricItems; }
        
        public Double getMaxPoints() { return maxPoints; }
        public void setMaxPoints(Double maxPoints) { this.maxPoints = maxPoints; }
    }
    
    /**
     * Helper class to hold criterion score information
     */
    private static class CriterionScore {
        private Double points;
        private String level;
        private String comment;
        
        public Double getPoints() { return points; }
        public void setPoints(Double points) { this.points = points; }
        
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }
    
    /**
     * Helper class to hold criteria analysis results
     */
    private static class CriteriaAnalysis {
        private String highestCriterion;
        private String lowestCriterion;
        
        public String getHighestCriterion() { return highestCriterion; }
        public void setHighestCriterion(String highestCriterion) { this.highestCriterion = highestCriterion; }
        
        public String getLowestCriterion() { return lowestCriterion; }
        public void setLowestCriterion(String lowestCriterion) { this.lowestCriterion = lowestCriterion; }
    }
    
    /**
     * Helper class to hold course information
     */
    private static class CourseInfo {
        private String courseCode;
        private String courseName;
        private String semester;
        private Integer academicYear;
        private String semesterValue;
        
        public String getCourseCode() { return courseCode; }
        public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
        
        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }
        
        public String getSemester() { return semester; }
        public void setSemester(String semester) { this.semester = semester; }
        
        public Integer getAcademicYear() { return academicYear; }
        public void setAcademicYear(Integer academicYear) { this.academicYear = academicYear; }
        
        public String getSemesterValue() { return semesterValue; }
        public void setSemesterValue(String semesterValue) { this.semesterValue = semesterValue; }
    }
    
    /**
     * Helper class to hold aggregated scores from multiple submissions
     */
    private static class AggregatedScores {
        private Double averageTotalScore;
        private java.time.ZonedDateTime latestSubmissionTime;
        private List<CriterionAverage> criterionAverages;
        
        public Double getAverageTotalScore() { return averageTotalScore; }
        public void setAverageTotalScore(Double averageTotalScore) { this.averageTotalScore = averageTotalScore; }
        
        public java.time.ZonedDateTime getLatestSubmissionTime() { return latestSubmissionTime; }
        public void setLatestSubmissionTime(java.time.ZonedDateTime latestSubmissionTime) { this.latestSubmissionTime = latestSubmissionTime; }
        
        public List<CriterionAverage> getCriterionAverages() { return criterionAverages; }
        public void setCriterionAverages(List<CriterionAverage> criterionAverages) { this.criterionAverages = criterionAverages; }
        
        public static class CriterionAverage {
            private String criterionName;
            private Double averageScore;
            private Integer submissionCount;
            
            public String getCriterionName() { return criterionName; }
            public void setCriterionName(String criterionName) { this.criterionName = criterionName; }
            
            public Double getAverageScore() { return averageScore; }
            public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
            
            public Integer getSubmissionCount() { return submissionCount; }
            public void setSubmissionCount(Integer submissionCount) { this.submissionCount = submissionCount; }
        }
    }
}


