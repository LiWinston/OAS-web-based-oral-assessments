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
            @Param("isReleased") Boolean isReleased
    );

    /**
     * Count total assessments for pagination
     */
    Integer countAssessmentSummaries(
            @Param("subjectId") Long subjectId,
            @Param("assignmentId") Long assignmentId,
            @Param("sessionId") Long sessionId,
            @Param("searchQuery") String searchQuery
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
            @Param("examinerId") Long examinerId
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
            @Param("releaseStatus") String releaseStatus
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
}
