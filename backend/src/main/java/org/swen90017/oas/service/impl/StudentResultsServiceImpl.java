package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.service.StudentResultsService;

import java.time.ZoneId;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class StudentResultsServiceImpl implements StudentResultsService {

    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;

    @Override
    public StudentResultOverviewDTO listStudentResults(Long studentId, String status, String semester, int pageNum, int pageSize, String sort, String ifModifiedSince) {
        ensureUserExists(studentId);

        // Placeholder: currently we do not have a results table; return empty list until grading storage is integrated
        StudentResultOverviewDTO dto = new StudentResultOverviewDTO();
        dto.setPageNum(pageNum);
        dto.setPageSize(pageSize);
        dto.setTotal(0L);
        dto.setData(new ArrayList<>());
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

        // Placeholder summary with minimal info
        StudentResultSummaryDTO response = new StudentResultSummaryDTO();
        StudentResultSummaryDTO.AssignmentInfo a = new StudentResultSummaryDTO.AssignmentInfo();
        a.setAssignmentId(assignmentId);
        a.setAssignmentName(assignment.getName());
        a.setCourseCode(null);
        a.setCourseName(null);
        a.setAssessmentType(assignment.getType());
        a.setSemester(null);
        response.setAssignment(a);

        StudentResultSummaryDTO.ResultInfo r = new StudentResultSummaryDTO.ResultInfo();
        r.setResultId(null);
        r.setFinalGrade(null);
        r.setPercentage(null);
        r.setTotalPoints(null);
        r.setMaxPoints(null);
        r.setResultStatus("released");
        r.setAssessedOn(null);
        r.setReleasedOn(assignment.getReleasedAt() == null ? null : assignment.getReleasedAt().atZone(ZoneId.of("UTC")));
        r.setAggregationMethod("average");
        r.setExaminerCount(null);
        response.setResult(r);

        StudentResultSummaryDTO.SummaryInfo s = new StudentResultSummaryDTO.SummaryInfo();
        s.setCriteriaCount(null);
        s.setHighestCriterion(null);
        s.setLowestCriterion(null);
        s.setFeedbackItemsCount(null);
        response.setSummary(s);
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
        // Placeholder empty breakdown
        StudentRubricBreakdownDTO dto = new StudentRubricBreakdownDTO();
        dto.setResultId(null);
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
        StudentExaminerFeedbackDTO dto = new StudentExaminerFeedbackDTO();
        dto.setResultId(null);
        dto.setExaminerFeedback(new ArrayList<>());
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
}


