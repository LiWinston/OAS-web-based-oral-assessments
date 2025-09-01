package org.swen90017.oas.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.dto.request.BatchCreateTimeSlotsRequestDTO;
import org.swen90017.oas.dto.request.DuplicateTimeSlotRequestDTO;
import org.swen90017.oas.dto.request.TimeSlotRequestDTO;
import org.swen90017.oas.dto.response.BatchCreateTimeSlotsResponseDTO;
import org.swen90017.oas.dto.response.GetTimeSlotsResponseDTO;
import org.swen90017.oas.dto.response.UpdateTimeSlotResponseDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;
import org.swen90017.oas.entity.TimeSlot;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/**
 * Time Slot Service Interface
 * Defines operations for managing time slots and sessions
 */
public interface TimeSlotService extends IService<TimeSlot> {

    /**
     * Get time slots for an assignment with optional filters
     *
     * @param assignmentId Assignment ID
     * @param date Optional date filter
     * @param status Optional status filter
     * @return Time slots response with list and summary
     */
    GetTimeSlotsResponseDTO getTimeSlots(Long assignmentId, LocalDate date, String status);

    /**
     * Batch create time slots with automatic session generation
     *
     * @param assignmentId Assignment ID
     * @param request Batch create request
     * @return Batch create response with created time slots
     */
    BatchCreateTimeSlotsResponseDTO batchCreateTimeSlots(Long assignmentId, BatchCreateTimeSlotsRequestDTO request);

    /**
     * Update a time slot
     *
     * @param timeSlotId Time slot ID
     * @param request Time slot update request
     * @return Updated time slot details
     */
    UpdateTimeSlotResponseDTO updateTimeSlot(Long timeSlotId, TimeSlotRequestDTO request);

    /**
     * Duplicate a time slot
     *
     * @param assignmentId Assignment ID that the time slot should belong to
     * @param timeSlotId Source time slot ID
     * @param request Duplicate request with modifications
     * @return Duplicated time slot details
     */
    TimeSlotDetailDTO duplicateTimeSlot(Long assignmentId, Long timeSlotId, DuplicateTimeSlotRequestDTO request);

    /**
     * Delete multiple time slots
     *
     * @param assignmentId Assignment ID
     * @param timeSlotIds  List of time slot IDs to delete
     * @return List of successfully deleted time slot IDs
     */
    List<Long> deleteTimeSlots(Long assignmentId, List<Long> timeSlotIds);

    /**
     * Generate sessions for a time slot based on session configuration
     *
     * @param timeSlot The time slot
     * @param sessionCount Number of sessions to generate
     * @return Number of sessions actually generated
     */
    int generateSessions(TimeSlot timeSlot, Integer sessionCount);

    /**
     * Aggregate calendar data for a given month
     *
     * @param assignmentId Assignment ID
     * @param month Target month (YearMonth)
     * @return Map keyed by date string (YYYY-MM-DD) with values: timeSlots, status, sessions
     */
    Map<String, CalendarResponseDTO.DateInfoDTO> getCalendarData(Long assignmentId, YearMonth month);
}
