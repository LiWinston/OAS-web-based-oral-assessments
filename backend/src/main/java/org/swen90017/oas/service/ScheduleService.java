package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.ReleaseScheduleRequestDTO;
import org.swen90017.oas.dto.response.ReleaseScheduleResponseDTO;
import org.swen90017.oas.dto.response.ScheduleStatusResponseDTO;

/**
 * Schedule Service Interface
 * Defines operations for schedule management and release
 */
public interface ScheduleService {

    /**
     * Get schedule status for an assignment
     *
     * @param assignmentId Assignment ID
     * @return Schedule status response
     */
    ScheduleStatusResponseDTO getScheduleStatus(Long assignmentId);

    /**
     * Release schedule for an assignment
     *
     * @param assignmentId Assignment ID
     * @param request Release request parameters
     * @return Release response with notification statistics
     */
    ReleaseScheduleResponseDTO releaseSchedule(Long assignmentId, ReleaseScheduleRequestDTO request);

    /**
     * Check if an assignment schedule is ready for release
     *
     * @param assignmentId Assignment ID
     * @return True if ready for release
     */
    Boolean isReadyForRelease(Long assignmentId);
}
