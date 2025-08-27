package org.swen90017.oas.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.AssignmentStatusStatsResponseDTO;
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
}
