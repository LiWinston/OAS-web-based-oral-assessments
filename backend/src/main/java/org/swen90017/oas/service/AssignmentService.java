package org.swen90017.oas.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.request.ReleaseResultsRequestDTO;
import org.swen90017.oas.dto.request.StudentAssignmentQueryRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusStatsResponseDTO;
import org.swen90017.oas.dto.response.AssignmentAvailabilityResponseDTO;
import org.swen90017.oas.dto.response.GroupContextResponseDTO;
import org.swen90017.oas.dto.response.ReleaseResultsResponseDTO;
import org.swen90017.oas.dto.response.StudentAssignmentListResponseDTO;
import org.swen90017.oas.entity.Assignment;

import java.util.List;
import java.util.Map;

/**
 * Assignment Service Interface
 * Defines basic CRUD operations for Assignment management
 */
public interface AssignmentService extends IService<Assignment> {

    /**
     * Get assignment by ID
     */
    AssignmentResponseDTO getAssignmentById(Long id);

    /**
     * Create new assignment
     */
    AssignmentResponseDTO createAssignment(AssignmentRequestDTO dto);

    /**
     * Update existing assignment
     */
    AssignmentResponseDTO updateAssignment(Long id, AssignmentRequestDTO dto);

    /**
     * Delete assignment
     */
    void deleteAssignment(Long id);

    /**
     * Get assignments by subject ID (with caching)
     */
    List<AssignmentResponseDTO> getAssignmentsBySubject(Long subjectId);

    /**
     * Get assignment count by subject ID (with caching)
     */
    Integer getAssignmentCountBySubject(Long subjectId);

    /**
     * Batch get assignment counts by subject IDs (SQL aggregation - no cache)
     * Returns Map<subjectId, assignmentCount>
     */
    Map<Long, Integer> getAssignmentCountsBySubjectIds(List<Long> subjectIds);

    /**
     * Get assignment status statistics
     * Returns statistics about assignment statuses
     */
    AssignmentStatusStatsResponseDTO getAssignmentStatusStats();

    /**
     * Get assignment status statistics by subject ID
     * Returns statistics about assignment statuses for a specific subject
     */
    AssignmentStatusStatsResponseDTO getAssignmentStatusStatsBySubject(Long subjectId);

    /**
     * Get group context for a student in an assignment
     * Returns group information including members for group assignments
     */
    GroupContextResponseDTO getGroupContext(Long studentId, Long assignmentId);

    /**
     * Get student assignments with pagination and filters
     * Returns paginated list of assignments for a specific student
     */
    StudentAssignmentListResponseDTO getStudentAssignments(Long studentId, StudentAssignmentQueryRequestDTO queryDTO);

    /**
     * Get assignment availability information for a specific student
     * Returns availability details including policies and quick stats
     */
    AssignmentAvailabilityResponseDTO getAssignmentAvailability(Long assignmentId, Long studentId);

    /**
     * Get assignment setup status
     * Returns the three-step setup progress information
     */
    AssignmentStatusResponseDTO getAssignmentStatus(Long assignmentId);

    /**
     * Release results for an assignment
     * Marks results as released to students
     */
    ReleaseResultsResponseDTO releaseResults(Long assignmentId, ReleaseResultsRequestDTO request);
}
