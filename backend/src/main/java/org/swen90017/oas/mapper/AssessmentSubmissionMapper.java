package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.AssessmentSubmission;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AssessmentSubmissionMapper extends BaseMapper<AssessmentSubmission> {

    AssessmentSubmission selectByUniqueTarget(@Param("assignmentId") Long assignmentId,
                                              @Param("sessionId") Long sessionId,
                                              @Param("subjectType") String subjectType,
                                              @Param("subjectId") Long subjectId,
                                              @Param("examinerId") Long examinerId);

    /**
     * Find assessment by enrollment ID and examiner ID (new approach)
     */
    AssessmentSubmission selectByEnrollmentAndExaminer(@Param("enrollmentId") Long enrollmentId,
                                                       @Param("examinerId") Long examinerId);

    List<AssessmentSubmission> listByExaminer(@Param("examinerId") Long examinerId,
                                              @Param("assignmentId") Long assignmentId,
                                              @Param("status") String status,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    List<AssessmentSubmission> listByStudentAndAssignment(@Param("studentId") Long studentId,
                                                          @Param("assignmentId") Long assignmentId,
                                                          @Param("status") String status);

    List<AssessmentSubmission> listByStudent(@Param("studentId") Long studentId,
                                             @Param("assignmentId") Long assignmentId,
                                             @Param("status") String status);

    List<AssessmentSubmission> listByStudentAndAssignmentWithGroups(@Param("studentId") Long studentId,
                                                                    @Param("assignmentId") Long assignmentId,
                                                                    @Param("status") String status);

    List<AssessmentSubmission> pageByExaminer(@Param("examinerId") Long examinerId,
                                              @Param("assignmentId") Long assignmentId,
                                              @Param("sessionId") Long sessionId,
                                              @Param("subjectType") String subjectType,
                                              @Param("subjectId") Long subjectId,
                                              @Param("status") String status,
                                              @Param("statuses") List<String> statuses,
                                              @Param("createdFrom") LocalDateTime createdFrom,
                                              @Param("createdTo") LocalDateTime createdTo,
                                              @Param("submittedFrom") LocalDateTime submittedFrom,
                                              @Param("submittedTo") LocalDateTime submittedTo,
                                              @Param("minScore") Double minScore,
                                              @Param("maxScore") Double maxScore,
                                              @Param("keyword") String keyword,
                                              @Param("offset") Integer offset,
                                              @Param("limit") Integer limit,
                                              @Param("sortBy") String sortBy,
                                              @Param("sortOrder") String sortOrder);

    Long countByExaminer(@Param("examinerId") Long examinerId,
                         @Param("assignmentId") Long assignmentId,
                         @Param("sessionId") Long sessionId,
                         @Param("subjectType") String subjectType,
                         @Param("subjectId") Long subjectId,
                         @Param("status") String status,
                         @Param("statuses") List<String> statuses,
                         @Param("createdFrom") LocalDateTime createdFrom,
                         @Param("createdTo") LocalDateTime createdTo,
                         @Param("submittedFrom") LocalDateTime submittedFrom,
                         @Param("submittedTo") LocalDateTime submittedTo,
                         @Param("minScore") Double minScore,
                         @Param("maxScore") Double maxScore,
                         @Param("keyword") String keyword);

    /**
     * Check if a session has any assessment records (regardless of status: draft, submitted, released, reopen)
     */
    Long countSubmittedAssessmentsBySession(@Param("sessionId") Long sessionId);

    /**
     * Check if an examiner has any assessment records in a session (regardless of status: draft, submitted, released, reopen)
     */
    Long countSubmittedAssessmentsBySessionAndExaminer(@Param("sessionId") Long sessionId, 
                                                       @Param("examinerId") Long examinerId);

    @Select("SELECT DISTINCT subject_type FROM assessment_submission WHERE assignment_id = #{assignmentId}")
    List<String> findDistinctSubjectTypesByAssignment(@Param("assignmentId") Long assignmentId);
}

