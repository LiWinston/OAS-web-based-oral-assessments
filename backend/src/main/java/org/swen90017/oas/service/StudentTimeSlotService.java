package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.CreateBookingRequestDTO;
import org.swen90017.oas.dto.request.RescheduleBookingRequestDTO;
import org.swen90017.oas.dto.response.BookableSessionsResponseDTO;
import org.swen90017.oas.dto.response.CreateBookingResponseDTO;
import org.swen90017.oas.dto.response.CurrentBookingResponseDTO;
import org.swen90017.oas.dto.response.RescheduleBookingResponseDTO;
import org.swen90017.oas.entity.SlotSession;

import java.time.LocalDate;
import java.util.List;

/**
 * Booking Service Interface
 * Defines operations for managing student/group bookings using existing slot_sessions table
 */
public interface StudentTimeSlotService {

    /**
     * Get bookable sessions for an assignment grouped by slot/day
     *
     * @param assignmentId Assignment ID
     * @param studentId Student ID
     * @param date Date filter
     * @param pageNum Page number
     * @param pageSize Page size
     * @param includeReasons Whether to include reasons for unavailable sessions
     * @return Bookable sessions response
     */
    BookableSessionsResponseDTO getBookableSessions(Long assignmentId, Long studentId, 
                                                  LocalDate date, Integer pageNum, 
                                                  Integer pageSize, Boolean includeReasons);

    /**
     * Create a new booking by updating slot_sessions table
     *
     * @param assignmentId Assignment ID
     * @param request Booking creation request
     * @return Created booking response
     */
    CreateBookingResponseDTO createBooking(Long assignmentId, CreateBookingRequestDTO request);

    /**
     * Get current booking for a student in an assignment
     *
     * @param studentId Student ID
     * @param assignmentId Assignment ID
     * @return Current booking response
     */
    CurrentBookingResponseDTO getCurrentBooking(Long studentId, Long assignmentId);

    /**
     * Reschedule an existing booking
     *
     * @param assignmentId Assignment ID
     * @param sessionId Current session ID
     * @param request Reschedule request
     * @return Reschedule response
     */
    RescheduleBookingResponseDTO rescheduleBooking(Long assignmentId, Long sessionId, 
                                                 RescheduleBookingRequestDTO request);

    /**
     * Cancel a booking by updating slot_sessions table
     *
     * @param assignmentId Assignment ID
     * @param sessionId Session ID
     * @param studentId Student ID
     * @return Cancelled session ID
     */
    Long cancelBooking(Long assignmentId, Long sessionId, Long studentId);

    /**
     * Find active bookings for a student in an assignment
     *
     * @param studentId Student ID
     * @param assignmentId Assignment ID
     * @return List of active booking sessions
     */
    List<SlotSession> findActiveBookingByStudent(Long studentId, Long assignmentId);

    /**
     * Find all available SlotSession objects for a given assignment
     *
     * @param assignmentId Assignment ID
     * @return List of available SlotSession objects
     */
    List<SlotSession> findAvailableSessionsByAssignment(Long assignmentId);

    /**
     * Find active booking for a group in an assignment
     *
     * @param groupId Group ID
     * @param assignmentId Assignment ID
     * @return Active booking session or null
     */
    SlotSession findActiveBookingByGroup(Long groupId, Long assignmentId);
}
