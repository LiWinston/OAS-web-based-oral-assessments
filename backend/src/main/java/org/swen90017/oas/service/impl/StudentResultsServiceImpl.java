package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
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

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentResultsServiceImpl implements StudentResultsService {

    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;

    @Override
    public StudentResultOverviewDTO listStudentResults(Long studentId, String status, String semester, int pageNum, int pageSize, String sort, String ifModifiedSince) {
        ensureUserExists(studentId);

        // Query submitted assessments for the student
        String queryStatus = "released".equals(status) ? "SUBMITTED" : null;
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudent(studentId, null, queryStatus);
        
        // Filter by assignment release status
        List<AssessmentSubmission> releasedSubmissions = submissions.stream()
                .filter(sub -> {
                    Assignment assignment = assignmentMapper.selectById(sub.getAssignmentId());
                    return assignment != null && Boolean.TRUE.equals(assignment.getIsReleased());
                })
                .collect(Collectors.toList());

        // Convert to DTO format
        List<StudentResultOverviewDTO.Item> items = releasedSubmissions.stream()
                .map(this::convertToOverviewItem)
                .collect(Collectors.toList());

        StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
        dto.setPageNum(pageNum);
        dto.setPageSize(pageSize);
        dto.setTotal((long) items.size());
        dto.setData(items);
        dto.setCachingHintSeconds(3600);
        return dto;
    }

    @Override
    public StudentResultSummaryDTO getAssignmentResultSummary(Long studentId, Long assignmentId, String ifModifiedSince) {
        ensureUserExists(studentId);
        ensureAssignmentParticipation(studentId, assignmentId);

        // Guard: check release flag on assignment
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignment(studentId, assignmentId, "SUBMITTED");
        if (submissions.isEmpty()) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }

        // Use the first submitted assessment as the primary result
        AssessmentSubmission primarySubmission = submissions.get(0);

        StudentResultSummaryDTO response = new StudentResultSummaryDTO();
        
        // Assignment info
        StudentResultSummaryDTO.AssignmentInfo assignmentInfo = new StudentResultSummaryDTO.AssignmentInfo();
        assignmentInfo.setAssignmentId(assignmentId);
        assignmentInfo.setAssignmentName(assignment.getName());
        assignmentInfo.setCourseCode(null); // TODO: get from subject
        assignmentInfo.setCourseName(null); // TODO: get from subject
        assignmentInfo.setAssessmentType(assignment.getType());
        assignmentInfo.setSemester(null); // TODO: get from subject
        response.setAssignment(assignmentInfo);

        // Result info
        StudentResultSummaryDTO.ResultInfo resultInfo = new StudentResultSummaryDTO.ResultInfo();
        resultInfo.setResultId(primarySubmission.getId());
        resultInfo.setFinalGrade(calculateGrade(primarySubmission.getTotalScore(), 100.0)); // TODO: get max from rubric
        resultInfo.setPercentage(primarySubmission.getTotalScore());
        resultInfo.setTotalPoints(primarySubmission.getTotalScore());
        resultInfo.setMaxPoints(100.0); // TODO: get from rubric
        resultInfo.setResultStatus("released");
        resultInfo.setAssessedOn(primarySubmission.getSubmittedAt() != null ? 
            primarySubmission.getSubmittedAt().atZone(ZoneId.of("UTC")) : null);
        resultInfo.setReleasedOn(assignment.getReleasedAt() != null ? 
            assignment.getReleasedAt().atZone(ZoneId.of("UTC")) : null);
        resultInfo.setAggregationMethod("average");
        resultInfo.setExaminerCount(submissions.size());
        response.setResult(resultInfo);

        // Summary info
        StudentResultSummaryDTO.SummaryInfo summaryInfo = new StudentResultSummaryDTO.SummaryInfo();
        summaryInfo.setCriteriaCount(0); // TODO: parse from rubricsInfoSnapshot
        summaryInfo.setHighestCriterion(null);
        summaryInfo.setLowestCriterion(null);
        summaryInfo.setFeedbackItemsCount(submissions.stream()
            .mapToInt(s -> s.getOverallFeedback() != null ? 1 : 0)
            .sum());
        response.setSummary(summaryInfo);
        
        return response;
    }

    @Override
    public StudentRubricBreakdownDTO getRubricBreakdown(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignment(studentId, assignmentId, "SUBMITTED");
        if (submissions.isEmpty()) {
            throw new BusinessException("423", "You weren't assessed for this assignment.");
        }

        // For now, return empty breakdown - TODO: parse scoresJson and rubricsInfoSnapshot
        StudentRubricBreakdownDTO dto = new StudentRubricBreakdownDTO();
        dto.setResultId(submissions.get(0).getId());
        StudentRubricBreakdownDTO.RubricBreakdown rb = new StudentRubricBreakdownDTO.RubricBreakdown();
        rb.setAggregationMethod("average");
        rb.setCriteria(new ArrayList<>());
        dto.setRubricBreakdown(rb);
        return dto;
    }

    @Override
    public StudentRubricScaleDTO getRubricScale(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
        }

        // For now, return empty scale - TODO: parse rubricsInfoSnapshot to extract performance levels
        StudentRubricScaleDTO dto = new StudentRubricScaleDTO();
        dto.setCriteria(new ArrayList<>());
        return dto;
    }

    @Override
    public StudentExaminerFeedbackDTO getExaminerFeedback(Long studentId, Long assignmentId) {
        ensureUserExists(studentId);
        ensureAssignmentParticipation(studentId, assignmentId);
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        if (Boolean.FALSE.equals(assignment.getIsReleased())) {
            throw new BusinessException("410", "Results for this assignment haven't been released yet.");
        }

        // Get submitted assessments for this student and assignment
        List<AssessmentSubmission> submissions = assessmentSubmissionMapper.listByStudentAndAssignment(studentId, assignmentId, "SUBMITTED");
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

    private StudentResultOverviewDTO.Item convertToOverviewItem(AssessmentSubmission submission) {
        Assignment assignment = assignmentMapper.selectById(submission.getAssignmentId());
        
        StudentResultOverviewDTO.Item item = new StudentResultOverviewDTO.Item();
        item.setAssignmentId(submission.getAssignmentId());
        item.setAssignmentName(assignment != null ? assignment.getName() : "Unknown Assignment");
        item.setCourseCode(null); // TODO: get from subject
        item.setCourseName(null); // TODO: get from subject
        item.setSemester(null); // TODO: get from subject
        item.setAssessmentType(assignment != null ? assignment.getType() : "UNKNOWN");
        
        StudentResultOverviewDTO.ResultSummary result = new StudentResultOverviewDTO.ResultSummary();
        result.setResultId(submission.getId());
        result.setFinalGrade(calculateGrade(submission.getTotalScore(), 100.0));
        result.setPercentage(submission.getTotalScore());
        result.setTotalPoints(submission.getTotalScore());
        result.setMaxPoints(100.0); // TODO: get from rubric
        result.setResultStatus("released");
        result.setAssessedOn(submission.getSubmittedAt() != null ? 
            submission.getSubmittedAt().atZone(ZoneId.of("UTC")) : null);
        result.setReleasedOn(assignment != null && assignment.getReleasedAt() != null ? 
            assignment.getReleasedAt().atZone(ZoneId.of("UTC")) : null);
        item.setResult(result);
        
        item.setHasDetailedFeedback(submission.getOverallFeedback() != null && !submission.getOverallFeedback().trim().isEmpty());
        
        return item;
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
        
        // For now, empty criterion feedback - TODO: parse scoresJson for detailed feedback
        feedback.setCriterionFeedback(new ArrayList<>());
        
        return feedback;
    }
}


