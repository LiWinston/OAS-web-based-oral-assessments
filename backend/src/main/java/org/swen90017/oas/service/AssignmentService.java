package org.swen90017.oas.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.swen90017.oas.dto.request.AssignmentRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.entity.Assignment;

import java.util.List;

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
     * Get assignments by subject ID
     */
    List<AssignmentResponseDTO> getAssignmentsBySubject(Long subjectId);
}
