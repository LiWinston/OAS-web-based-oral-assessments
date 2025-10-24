package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.GroupGradeExportDTO;
import org.swen90017.oas.dto.response.IndividualGradeExportDTO;
import org.swen90017.oas.dto.response.TeacherScoringDetailExportDTO;

import java.util.List;

/**
 * Grades Export Service
 * Handles exporting grades in various CSV formats
 */
public interface GradesExportService {

    /**
     * Export individual grades for an assignment
     * @param assignmentId Assignment ID
     * @return List of individual grade export records
     */
    List<IndividualGradeExportDTO> exportIndividualGrades(Long assignmentId);

    /**
     * Export group grades for an assignment
     * @param assignmentId Assignment ID
     * @return List of group grade export records
     */
    List<GroupGradeExportDTO> exportGroupGrades(Long assignmentId);

    /**
     * Export teacher scoring details for an assignment
     * @param assignmentId Assignment ID
     * @return List of teacher scoring detail export records
     */
    List<TeacherScoringDetailExportDTO> exportTeacherScoringDetails(Long assignmentId);
}

