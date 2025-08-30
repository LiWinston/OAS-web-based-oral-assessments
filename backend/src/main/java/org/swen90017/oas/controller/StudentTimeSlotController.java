package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.CreateBookingRequestDTO;
import org.swen90017.oas.dto.request.RescheduleBookingRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.StudentTimeSlotService;

import javax.validation.Valid;
import java.time.LocalDate;

/**
 * Booking Controller
 * Provides REST API endpoints for student/group booking operations using existing slot_sessions table
 */
@Tag(name = "Student Booking", description = "API endpoints for student booking operations")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StudentTimeSlotController {

    private final StudentTimeSlotService studentTimeSlotService;

    /**
     * Get bookable sessions for an assignment grouped by slot/day
     */
    @Operation(summary = "List bookable sessions", description = "Get bookable sessions for an assignment grouped by slot/day")
    @GetMapping("/assignments/{assignmentId}/sessions")
    @Log(module = "Student Booking", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<BookableSessionsResponseDTO>> getBookableSessions(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Student ID") @RequestParam Long studentId,
            @Parameter(description = "Date filter (YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize,
            @Parameter(description = "Include reasons for unavailable sessions") @RequestParam(defaultValue = "false") Boolean includeReasons) {
        
        BookableSessionsResponseDTO response = studentTimeSlotService.getBookableSessions(
            assignmentId, studentId, date, pageNum, pageSize, includeReasons);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Create a new booking
     */
    @Operation(summary = "Create booking", description = "Create a new booking for a session")
    @PostMapping("/assignments/{assignmentId}/bookings")
    @Log(module = "Student Booking", businessType = BusinessType.BOOKING)
    public ResponseEntity<Result<CreateBookingResponseDTO>> createBooking(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody CreateBookingRequestDTO request) {
        
        CreateBookingResponseDTO response = studentTimeSlotService.createBooking(assignmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Result.success(response));
    }

    /**
     * Get current booking for a student in an assignment
     */
    @Operation(summary = "Get current booking", description = "Get current booking for a student in an assignment")
    @GetMapping("/students/{studentId}/assignments/{assignmentId}/booking")
    @Log(module = "Student Booking", businessType = BusinessType.QUERY)
    public ResponseEntity<Result<CurrentBookingResponseDTO>> getCurrentBooking(
            @Parameter(description = "Student ID") @PathVariable Long studentId,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        
        CurrentBookingResponseDTO response = studentTimeSlotService.getCurrentBooking(studentId, assignmentId);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Reschedule an existing booking
     */
    @Operation(summary = "Reschedule booking", description = "Reschedule an existing booking to a different session")
    @PostMapping("/assignments/{assignmentId}/bookings/{sessionId}/reschedule")
    @Log(module = "Student Booking", businessType = BusinessType.BOOKING)
    public ResponseEntity<Result<RescheduleBookingResponseDTO>> rescheduleBooking(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @Valid @RequestBody RescheduleBookingRequestDTO request) {
        
        RescheduleBookingResponseDTO response = studentTimeSlotService.rescheduleBooking(assignmentId, sessionId, request);
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * Cancel a booking
     */
    @Operation(summary = "Cancel booking", description = "Cancel an existing booking")
    @DeleteMapping("/assignments/{assignmentId}/bookings/{sessionId}")
    @Log(module = "Student Booking", businessType = BusinessType.CANCEL_BOOKING)
    public ResponseEntity<Result<Long>> cancelBooking(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @Parameter(description = "Student ID") @RequestParam Long studentId) {
        
        Long cancelledSessionId = studentTimeSlotService.cancelBooking(assignmentId, sessionId, studentId);
        return ResponseEntity.ok(Result.success(cancelledSessionId));
    }
}
