package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.AssessmentSubmission;

import java.util.List;
import java.util.Map;

@Mapper
public interface AdminResultsMapper extends BaseMapper<AssessmentSubmission> {

    /**
     * List assessments for an assignment with pagination and filtering
     */
    List<Map<String, Object>> listAssessmentSummaries(
            @Param("subjectId") Long subjectId,
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("searchQuery") String searchQuery,
            @Param("offset") Integer offset,
            @Param("limit") Integer limit,
            @Param("isReleased") Boolean isReleased,
            @Param("examinerStatus") String examinerStatus
    );

    /**
     * Count total assessments for pagination
     */
    Integer countAssessmentSummaries(
            @Param("subjectId") Long subjectId,
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("searchQuery") String searchQuery,
            @Param("isReleased") Boolean isReleased,
            @Param("examinerStatus") String examinerStatus
    );

    /**
     * Get detailed assessment information including all examiner markings
     */
    Map<String, Object> getAssessmentDetail(
            @Param("submissionId") Long submissionId
    );

    /**
     * Get all examiner markings for a specific assessment
     */
    List<Map<String, Object>> getExaminerMarkings(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId
    );

    /**
     * Get specific examiner's marking details
     */
    Map<String, Object> getExaminerMarkDetail(
            @Param("submissionId") Long submissionId,
            @Param("examinerId") Long examinerId
    );

    /**
     * Find submission by unique identifiers
     */
    AssessmentSubmission findSubmissionByIdentifiers(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId,
            @Param("examinerId") Long examinerId
    );

    /**
     * Update examiner assessment status to REOPENED
     */
    Integer reopenExaminerAssessment(
            @Param("submissionId") Long submissionId,
            @Param("examinerId") Long examinerId,
            @Param("reason") String reason
    );

    /**
     * Update assessment release status at assignment level
     */
    Integer updateAssessmentReleaseStatus(
            @Param("assignmentId") Long assignmentId,
            @Param("releaseStatus") String releaseStatus
    );

    /**
     * Update assignment release status (is_released field)
     */
    Integer updateAssignmentReleaseStatus(
            @Param("assignmentId") Long assignmentId,
            @Param("released") Boolean released
    );


    /**
     * Set final score override for assessment
     */
    Integer setFinalScoreOverride(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId,
            @Param("finalScore") Double finalScore,
            @Param("reason") String reason,
            @Param("userId") Long userId
    );

    /**
     * Set final score override for all examiner submissions of the same student in the same assignment
     */
    Integer setFinalScoreOverrideForAllExaminers(
            @Param("assignmentId") Long assignmentId,
            @Param("submissionId") Long submissionId,
            @Param("finalScore") Double finalScore,
            @Param("reason") String reason,
            @Param("userId") Long userId
    );

    /**
     * Update assessment submission release status for all submissions of an assessment
     */
    Integer updateAssessmentSubmissionReleaseStatus(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId,
            @Param("releaseStatus") String releaseStatus,
            @Param("releaseMode") String releaseMode
    );

    /**
     * Update assessment submission status for all submissions of an assessment
     */
    Integer updateAssessmentSubmissionStatus(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId,
            @Param("status") String status
    );

    /**
     * Count distinct students affected by assessment submission status update
     */
    Integer countDistinctStudentsForAssessment(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("subjectType") String subjectType,
            @Param("subjectId") Long subjectId
    );

    /**
     * Get examiner scoring information for an individual student
     */
    Map<String, Object> getIndividualExaminerScoring(
            @Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId
    );

    /**
     * Get examiner scoring information for a group
     */
    Map<String, Object> getGroupExaminerScoring(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    /**
     * Get all examiner markings for an individual student across all sessions
     */
    List<Map<String, Object>> getIndividualExaminerMarkings(
            @Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId
    );

    /**
     * Get all examiner markings for a group across all sessions
     */
    List<Map<String, Object>> getGroupExaminerMarkings(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    /**
     * Get sessions for an assignment with participant count (Step 1)
     */
    List<Map<String, Object>> getSessionsForAssignment(
            @Param("assignmentId") Long assignmentId,
            @Param("searchQuery") String searchQuery,
            @Param("offset") Integer offset,
            @Param("limit") Integer limit
    );

    /**
     * Count total sessions for an assignment (Step 1)
     */
    Integer countSessionsForAssignment(
            @Param("assignmentId") Long assignmentId,
            @Param("searchQuery") String searchQuery
    );

    /**
     * Get participants for a session (Step 2)
     */
    List<Map<String, Object>> getParticipantsForSession(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("type") String type,
            @Param("status") String status,
            @Param("searchQuery") String searchQuery,
            @Param("offset") Integer offset,
            @Param("limit") Integer limit
    );

    /**
     * Count total participants for a session (Step 2)
     */
    Integer countParticipantsForSession(
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("type") String type,
            @Param("status") String status,
            @Param("searchQuery") String searchQuery
    );

    /**
     * Get group detail with complete information (Step 3)
     */
    Map<String, Object> getGroupDetailWithExaminers(
            @Param("assignmentId") Long assignmentId,
            @Param("groupId") Long groupId
    );

    /**
     * Get individual detail with complete information (Step 3)
     */
    Map<String, Object> getIndividualDetailWithExaminers(
            @Param("assignmentId") Long assignmentId,
            @Param("studentId") Long studentId
    );
}
