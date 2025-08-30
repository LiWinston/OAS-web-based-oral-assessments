package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.*;
import org.swen90017.oas.dto.response.BatchCreateTimeSlotsResponseDTO;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.dto.response.GetTimeSlotsResponseDTO;
import org.swen90017.oas.dto.response.ReleaseScheduleResponseDTO;
import org.swen90017.oas.dto.response.ScheduleStatusResponseDTO;
import org.swen90017.oas.dto.response.SessionConfigResponseDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;

import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.ScheduleService;
import org.swen90017.oas.service.SessionConfigService;
import org.swen90017.oas.service.TimeSlotService;

import javax.validation.Valid;
import java.time.YearMonth;
import java.util.Map;

/**
 * Admin Timeslot Controller
 * Provides REST API endpoints for course administrators to manage time slots and session configurations
 */
@Tag(name = "Admin Timeslot Management", description = "API endpoints for administrators to manage time slots and session configurations")
@RestController
@RequestMapping("/api/admin/assignments")
@RequiredArgsConstructor
public class AdminTimeslotController {

    private final SessionConfigService sessionConfigService;
    private final TimeSlotService timeSlotService;
    private final ScheduleService scheduleService;

    /**
     * Get session configuration for an assignment
     */
    @Operation(summary = "Get session configuration", description = "Retrieve session configuration for a specific assignment")
    @GetMapping("/{assignmentId}/session-config")
    @Log(module = "Session Configuration", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<SessionConfigResponseDTO>> getSessionConfig(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        SessionConfigResponseDTO config = sessionConfigService.getSessionConfig(assignmentId);
        return ResponseEntity.ok(Result.success(config));
    }

    /**
     * Update session configuration for an assignment
     */
    @Operation(summary = "Update session configuration", description = "Create or update session configuration for a specific assignment")
    @PutMapping("/{assignmentId}/session-config")
    @Log(module = "Session Configuration", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<SessionConfigResponseDTO>> updateSessionConfig(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody SessionConfigRequestDTO request) {
        SessionConfigResponseDTO config = sessionConfigService.upsertSessionConfig(assignmentId, request);
        return ResponseEntity.ok(Result.success(config));
    }

    /**
     * Delete session configuration for an assignment
     */
    @Operation(summary = "Delete session configuration", description = "Delete session configuration for a specific assignment")
    @DeleteMapping("/{assignmentId}/session-config")
    @Log(module = "Session Configuration", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<Void>> deleteSessionConfig(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        sessionConfigService.deleteSessionConfig(assignmentId);
        return ResponseEntity.ok(Result.success());
    }

    /**
     * Get time slots for an assignment
     */
    @Operation(summary = "Get time slots", description = "Retrieve time slots for a specific assignment with optional filters")
    @GetMapping("/{assignmentId}/timeslots")
    @Log(module = "Time Slot Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<GetTimeSlotsResponseDTO>> getTimeSlots(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Filter by date (YYYY-MM-DD)") @RequestParam(required = false) String date,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status) {
        java.time.LocalDate dateFilter = date != null ? java.time.LocalDate.parse(date) : null;
        GetTimeSlotsResponseDTO response = timeSlotService.getTimeSlots(assignmentId, dateFilter, status);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Get calendar aggregated data for a given month
     */
    @Operation(summary = "Get Calendar Data", description = "Return per-date aggregation of time slots and sessions for a given month")
    @GetMapping("/{assignmentId}/calendar")
    @Log(module = "Calendar", businessType = BusinessType.QUERY)
    public Result<CalendarResponseDTO> getCalendar(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Target month in YYYY-MM format") @RequestParam String month) {
        YearMonth ym = YearMonth.parse(month);
        Map<String, CalendarResponseDTO.DateInfoDTO> dates = timeSlotService.getCalendarData(assignmentId, ym);

        CalendarResponseDTO dto = new CalendarResponseDTO();
        dto.setMonth(month);
        dto.setDates(dates);
        return Result.success(dto);
    }

    /**
     * Batch create time slots
     */
    @Operation(summary = "Batch create time slots", description = "Create multiple time slots with automatic session generation")
    @PostMapping("/{assignmentId}/timeslots/batch")
    @Log(module = "Time Slot Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<BatchCreateTimeSlotsResponseDTO>> batchCreateTimeSlots(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody BatchCreateTimeSlotsRequestDTO request) {
        BatchCreateTimeSlotsResponseDTO response = timeSlotService.batchCreateTimeSlots(assignmentId, request);
        return ResponseEntity.status(201).body(Result.success(response));
    }

    /**
     * Update time slot
     */
    @Operation(summary = "Update time slot", description = "Update an existing time slot")
    @PutMapping("/{assignmentId}/timeslots/{timeSlotId}")
    @Log(module = "Time Slot Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<TimeSlotDetailDTO>> updateTimeSlot(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Time slot ID") @PathVariable Long timeSlotId,
            @Valid @RequestBody TimeSlotRequestDTO request) {
        TimeSlotDetailDTO timeSlot = timeSlotService.updateTimeSlot(timeSlotId, request);
        return ResponseEntity.ok(Result.success(timeSlot));
    }

    /**
     * Duplicate time slot
     */
    @Operation(summary = "Duplicate time slot", description = "Create a copy of an existing time slot with modifications")
    @PostMapping("/{assignmentId}/timeslots/{timeSlotId}/duplicate")
    @Log(module = "Time Slot Management", businessType = BusinessType.INSERT)
    public ResponseEntity<Result<TimeSlotDetailDTO>> duplicateTimeSlot(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Source time slot ID") @PathVariable Long timeSlotId,
            @RequestBody(required = false) DuplicateTimeSlotRequestDTO request) {
        if (request == null) {
            request = new DuplicateTimeSlotRequestDTO();
        }
        TimeSlotDetailDTO duplicatedSlot = timeSlotService.duplicateTimeSlot(timeSlotId, request);
        return ResponseEntity.status(201).body(Result.success(duplicatedSlot));
    }

    /**
     * Delete time slots
     */
    @Operation(summary = "Delete time slots", description = "Delete multiple time slots")
    @DeleteMapping("/{assignmentId}/timeslots")
    @Log(module = "Time Slot Management", businessType = BusinessType.DELETE)
    public ResponseEntity<Result<String>> deleteTimeSlots(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody DeleteTimeSlotsRequestDTO request) {
        timeSlotService.deleteTimeSlots(assignmentId, request.getTimeSlotIds());
        String message = String.format("%d time slots deleted successfully", request.getTimeSlotIds().size());
        return ResponseEntity.ok(Result.success(message));
    }

    /**
     * Get schedule status
     */
    @Operation(summary = "Get schedule status", description = "Get schedule status and readiness for an assignment")
    @GetMapping("/{assignmentId}/schedule/status")
    @Log(module = "Schedule Management", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<ScheduleStatusResponseDTO>> getScheduleStatus(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        ScheduleStatusResponseDTO status = scheduleService.getScheduleStatus(assignmentId);
        return ResponseEntity.ok(Result.success(status));
    }

    /**
     * Release schedule
     */
    @Operation(summary = "Release schedule", description = "Release the schedule to make it available for student booking")
    @PostMapping("/{assignmentId}/schedule/release")
    @Log(module = "Schedule Management", businessType = BusinessType.UPDATE)
    public ResponseEntity<Result<ReleaseScheduleResponseDTO>> releaseSchedule(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ReleaseScheduleRequestDTO request) {
        ReleaseScheduleResponseDTO response = scheduleService.releaseSchedule(assignmentId, request);
        return ResponseEntity.ok(Result.success(response));
    }

    @PutMapping("/{assignmentId}/examiners/session-limits")
    @Operation(summary = "Set examiner session limits", description = "Set the maximum number of sessions an examiner can handle per day and per assignment")
    @Log(module = "Examiner Management", businessType = BusinessType.UPDATE)
    public Result<String> setExaminerSessionLimits(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateExaminerSessionLimitsRequestDTO request) {
        scheduleService.updateExaminerSessionLimits(assignmentId, request);
        return Result.success();
    }
}
