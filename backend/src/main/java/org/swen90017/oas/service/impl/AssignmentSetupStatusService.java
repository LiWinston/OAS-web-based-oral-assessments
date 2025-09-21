package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.response.AssignmentSetupStatusDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.TimeSlot;
import org.swen90017.oas.mapper.TimeSlotMapper;

/**
 * Service for calculating assignment setup status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentSetupStatusService {

    private final TimeSlotMapper timeSlotMapper;

    /**
     * Calculate setup status for an assignment
     */
    public AssignmentSetupStatusDTO calculateSetupStatus(Assignment assignment) {
        AssignmentSetupStatusDTO status = new AssignmentSetupStatusDTO();

        // 1. Rubric configured: check if rubric exists and has content
        boolean rubricConfigured = isRubricConfigured(assignment);
        status.setRubricConfigured(rubricConfigured);

        // 2. Time slots configured: check if at least one valid time slot exists
        boolean timeSlotsConfigured = isTimeSlotsConfigured(assignment.getId());
        status.setTimeSlotsConfigured(timeSlotsConfigured);

        // 3. Results released: check if results are released to students
        boolean resultsReleased = isResultsReleased(assignment);
        status.setResultsReleased(resultsReleased);

        // Set release timestamp if results are released
        if (resultsReleased && assignment.getResultsReleasedAt() != null) {
            status.setReleasedOn(assignment.getResultsReleasedAt());
        }

        // Set last updated timestamp
        status.setLastUpdated(assignment.getUpdateTime());

        // Calculate progress
        status.calculateProgress();

        return status;
    }

    /**
     * Check if rubric is configured for the assignment
     * A rubric is considered configured if:
     * - rubricMetaInfo is not null/empty
     * - rubricsInfo is not null/empty
     */
    private boolean isRubricConfigured(Assignment assignment) {
        return assignment.getRubricMetaInfo() != null && 
               !assignment.getRubricMetaInfo().trim().isEmpty() &&
               assignment.getRubricsInfo() != null && 
               !assignment.getRubricsInfo().trim().isEmpty();
    }

    /**
     * Check if time slots are configured for the assignment
     * Time slots are considered configured if at least one valid time slot exists
     */
    private boolean isTimeSlotsConfigured(Long assignmentId) {
        QueryWrapper<TimeSlot> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("assignment_id", assignmentId);
        
        // Count non-deleted time slots
        Long count = timeSlotMapper.selectCount(queryWrapper);
        return count != null && count > 0;
    }

    /**
     * Check if results are released for the assignment
     */
    private boolean isResultsReleased(Assignment assignment) {
        return Boolean.TRUE.equals(assignment.getResultsReleased());
    }
}
