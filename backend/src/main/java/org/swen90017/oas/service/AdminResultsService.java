package org.swen90017.oas.service;

import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.dto.request.ReleaseAssessmentRequestDTO;
import org.swen90017.oas.dto.request.ReviewExaminerRequestDTO;
import org.swen90017.oas.dto.request.UpdateFinalScoreRequestDTO;
import org.swen90017.oas.dto.response.*;

public interface AdminResultsService {

    /**
     * List assessments for an assignment with pagination and filtering
     */
    PageResult<AssessmentSummaryDTO> listAssessments(
            Long subjectId, 
            Long assignmentId, 
            Integer pageNum, 
            Integer pageSize,
            String searchQuery,
            Long sessionId,
            Boolean isReleased
    );

    /**
     * Get detailed assessment information including all examiner markings
     */
    AssessmentDetailDTO getAssessmentDetail(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId
    );

    /**
     * Get specific examiner's marking details
     */
    ExaminerMarkDetailDTO getExaminerMarkDetail(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId, 
            Long examinerId
    );

    /**
     * Review an examiner's marking (reopen it)
     */
    ReviewExaminerResponseDTO reviewExaminerMarking(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId, 
            Long examinerId,
            ReviewExaminerRequestDTO request,
            Long adminUserId
    );

    /**
     * Set final score for an assessment (manual override)
     */
    AssessmentDetailDTO setFinalScore(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId,
            UpdateFinalScoreRequestDTO request,
            Long adminUserId
    );

    /**
     * Release an assessment to students
     */
    ReleaseAssessmentResponseDTO releaseAssessment(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId,
            ReleaseAssessmentRequestDTO request,
            Long adminUserId
    );
}
