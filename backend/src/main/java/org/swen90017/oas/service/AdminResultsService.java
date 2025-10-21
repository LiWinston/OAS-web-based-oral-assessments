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
            Boolean isReleased,
            String examinerStatus,
            Boolean includeAll
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
     * @deprecated Use releaseGroupAssessment or releaseIndividualAssessment instead
     */
    @Deprecated
    ReleaseAssessmentResponseDTO releaseAssessment(
            Long subjectId, 
            Long assignmentId, 
            Long submissionId,
            ReleaseAssessmentRequestDTO request,
            Long adminUserId
    );

    /**
     * Release group assessment for all examiners
     */
    ReleaseAssessmentResponseDTO releaseGroupAssessment(
            Long subjectId,
            Long assignmentId,
            Long groupId,
            ReleaseAssessmentRequestDTO request,
            Long adminUserId
    );

    /**
     * Release individual assessment for all examiners
     */
    ReleaseAssessmentResponseDTO releaseIndividualAssessment(
            Long subjectId,
            Long assignmentId,
            Long studentId,
            ReleaseAssessmentRequestDTO request,
            Long adminUserId
    );

    /**
     * Get examiner scoring information for an individual student
     */
    ExaminerScoringDTO getIndividualExaminerScoring(
            Long subjectId,
            Long assignmentId,
            Long studentId
    );

    /**
     * Get examiner scoring information for a group
     */
    ExaminerScoringDTO getGroupExaminerScoring(
            Long subjectId,
            Long assignmentId,
            Long groupId
    );

    /**
     * Get sessions for an assignment (Step 1)
     */
    PageResult<AdminSessionResultsDTO.SessionItem> getSessionsForAssignment(
            Long subjectId,
            Long assignmentId,
            Integer pageNum,
            Integer pageSize,
            String searchQuery
    );

    /**
     * Get participants for a session (Step 2)
     */
    PageResult<AdminSessionParticipantsDTO.ParticipantItem> getParticipantsForSession(
            Long subjectId,
            Long assignmentId,
            Long sessionId,
            Integer pageNum,
            Integer pageSize,
            String type,
            String status,
            String searchQuery
    );

    /**
     * Get group detail with complete information (Step 3 - Enhanced)
     */
    AdminParticipantDetailDTO getGroupDetailWithExaminers(
            Long subjectId,
            Long assignmentId,
            Long groupId
    );

    /**
     * Get individual detail with complete information (Step 3 - Enhanced)
     */
    AdminParticipantDetailDTO getIndividualDetailWithExaminers(
            Long subjectId,
            Long assignmentId,
            Long studentId
    );
}
