package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.dto.request.CreateBookingRequestDTO;
import org.swen90017.oas.dto.request.RescheduleBookingRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.StudentTimeSlotService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

/**
 * Booking Service Implementation
 * Implements operations for managing student/group bookings using existing slot_sessions table
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudentTimeSlotServiceImpl implements StudentTimeSlotService {

    private final AssignmentMapper assignmentMapper;
    private final TimeSlotMapper timeSlotMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final VenueMapper venueMapper;
    private final SysStudentMapper sysStudentMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SessionStudentMapper sessionStudentMapper;

    @Override
    public BookableSessionsResponseDTO getBookableSessions(Long assignmentId, Long studentId, 
                                                         LocalDate date, Integer pageNum, 
                                                         Integer pageSize, Boolean includeReasons) {
        // Validate assignment exists
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Validate student exists
        SysStudent student = sysStudentMapper.selectById(studentId);
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }

        // Get time slots for the assignment and date
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, null, date.atStartOfDay(), date.atTime(23, 59, 59));
        
        // Filter out understaffed slots
        timeSlots = timeSlots.stream()
                .filter(slot -> slot.getCurrentExaminers() >= slot.getRequiredExaminers())
                .collect(Collectors.toList());

        // Build response
        BookableSessionsResponseDTO response = new BookableSessionsResponseDTO();
        
        // Set assignment info
        BookableSessionsResponseDTO.AssignmentInfoDTO assignmentInfo = new BookableSessionsResponseDTO.AssignmentInfoDTO();
        assignmentInfo.setAssignmentId(assignment.getId());
        assignmentInfo.setAssignmentName(assignment.getName());
        assignmentInfo.setAssessmentType(assignment.getType());
        response.setAssignment(assignmentInfo);

        // Set calendar info
        BookableSessionsResponseDTO.CalendarInfoDTO calendarInfo = new BookableSessionsResponseDTO.CalendarInfoDTO();
        calendarInfo.setDate(date.format(DateTimeFormatter.ISO_LOCAL_DATE));
        response.setCalendar(calendarInfo);

        // Build time slots with sessions
        List<BookableSessionsResponseDTO.TimeSlotWithSessionsDTO> timeSlotDTOs = new ArrayList<>();
        for (TimeSlot slot : timeSlots) {
            BookableSessionsResponseDTO.TimeSlotWithSessionsDTO timeSlotDTO = buildTimeSlotWithSessions(slot, includeReasons);
            timeSlotDTOs.add(timeSlotDTO);
        }
        response.setTimeSlots(timeSlotDTOs);

        return response;
    }

    @Override
    @Transactional
    public CreateBookingResponseDTO createBooking(Long assignmentId, CreateBookingRequestDTO request) {
        // Validate session exists
        SlotSession session = slotSessionMapper.selectById(request.getSessionId());
        if (session == null) {
            throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        }
        
        // Validate student exists
        SysStudent student = sysStudentMapper.selectById(request.getStudentId());
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }

        // Determine booking type and subject ID
        String bookingType = "INDIVIDUAL";
        Long subjectId = request.getStudentId();
        
        if (request.getGroupId() != null) {
            bookingType = "GROUP";
            subjectId = request.getGroupId();
        }

        // Check if already booked
        SessionStudent existingBooking = sessionStudentMapper.selectBySessionAndSubject(
            request.getSessionId(), bookingType, subjectId);
        if (existingBooking != null) {
            throw new BusinessException(BusinessError.ALREADY_BOOKED);
        }

        // Create booking record in session_student table
        SessionStudent sessionStudent = new SessionStudent();
        sessionStudent.setSessionId(request.getSessionId());
        sessionStudent.setType(bookingType);
        sessionStudent.setSubjectId(subjectId);
        sessionStudent.setBookedTime(LocalDateTime.now());
        sessionStudentMapper.insert(sessionStudent);

        // Update enrolled_groups count in slot_sessions
        int updated = slotSessionMapper.incrementBookedIfAvailable(request.getSessionId());
        if (updated == 0) {
            throw new BusinessException(BusinessError.SESSION_CONFLICT);
        }

        // Build response
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        return buildCreateBookingResponse(session, assignment, request);
    }

    @Override
    public CurrentBookingResponseDTO getCurrentBooking(Long studentId, Long assignmentId) {
        // Validate assignment exists
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // First check if student belongs to a group for this assignment
        Long groupId = getStudentGroupId(studentId, assignmentId);
        
        SlotSession activeBooking = null;
        if (groupId != null) {
            // Check for group booking first
            activeBooking = findActiveBookingByGroup(groupId, assignmentId);
        }
        
        // If no group booking found, check for individual student booking
        if (activeBooking == null) {
            List<SlotSession> studentBookings = findActiveBookingByStudent(studentId, assignmentId);
            if (!studentBookings.isEmpty()) {
                activeBooking = studentBookings.get(0);
            }
        }

        CurrentBookingResponseDTO response = new CurrentBookingResponseDTO();
        response.setHasActiveBooking(activeBooking != null);

        if (activeBooking != null) {
            response.setBooking(buildCurrentBookingInfo(activeBooking, assignment));
        }

        return response;
    }

    @Override
    @Transactional
    public RescheduleBookingResponseDTO rescheduleBooking(Long assignmentId, Long sessionId, 
                                                        RescheduleBookingRequestDTO request) {
        // Validate current session is booked by the student
        SlotSession currentSession = validateSessionOwnership(sessionId, request.getStudentId(), assignmentId);
        
        // Validate target session
        SlotSession targetSession = validateSessionForBooking(request.getTargetSessionId());
        
        // Check if target session is available
        checkSessionAvailability(request.getTargetSessionId());

        // 自减目标会话占用
        slotSessionMapper.decrementBookedIfExists(currentSession.getSessionId());

        // Update target session to booked
        targetSession.setStatus(SessionStatus.BOOKED);
        targetSession.setBookedSubjectId(currentSession.getBookedSubjectId());
        targetSession.setBookedSubjectType(currentSession.getBookedSubjectType());
        targetSession.setBookedAt(LocalDateTime.now());
        slotSessionMapper.updateById(targetSession);

        // Build response
        RescheduleBookingResponseDTO response = new RescheduleBookingResponseDTO();
        response.setBookingId(sessionId); // Using sessionId as bookingId for compatibility
        response.setFromSessionId(sessionId);
        response.setToSessionId(request.getTargetSessionId());
        
        RescheduleBookingResponseDTO.NotificationsDTO notifications = new RescheduleBookingResponseDTO.NotificationsDTO();
        notifications.setEmailQueued(true);
        notifications.setIcsUrl("/api/calendar/booking/" + sessionId + ".ics");
        response.setNotifications(notifications);

        return response;
    }

    @Override
    @Transactional
    public Long cancelBooking(Long assignmentId, Long sessionId, Long studentId) {
        // Find the booking record in session_student table
        SessionStudent studentBooking = sessionStudentMapper.selectBySessionAndSubject(sessionId, "STUDENT", studentId);
        if (studentBooking == null) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        // Delete the booking record
        sessionStudentMapper.deleteById(studentBooking.getId());
        
        // Decrement enrolled_groups count in slot_sessions
        slotSessionMapper.decrementBookedIfExists(sessionId);

        return sessionId;
    }

    @Override
    public List<SlotSession> findActiveBookingByStudent(Long studentId, Long assignmentId) {
        // Find bookings from session_student table
        List<SessionStudent> bookings = sessionStudentMapper.listBySubject("STUDENT", studentId);
        
        // Get the corresponding slot sessions
        List<SlotSession> sessions = new ArrayList<>();
        for (SessionStudent booking : bookings) {
            SlotSession session = slotSessionMapper.selectById(booking.getSessionId());
            if (session != null && session.getAssignmentId().equals(assignmentId)) {
                sessions.add(session);
            }
        }
        
        return sessions;
    }

    @Override
    public List<SlotSession> findAvailableSessionsByAssignment(Long assignmentId) {
        // Use the optimized mapper method to find all available sessions for the assignment
        return slotSessionMapper.findAvailableSessionsByAssignment(assignmentId);
    }

    @Override
    public SlotSession findActiveBookingByGroup(Long groupId, Long assignmentId) {
        // Find group bookings from session_student table
        List<SessionStudent> bookings = sessionStudentMapper.listBySubject("GROUP", groupId);
        
        // Get the corresponding slot session for this assignment
        for (SessionStudent booking : bookings) {
            SlotSession session = slotSessionMapper.selectById(booking.getSessionId());
            if (session != null && session.getAssignmentId().equals(assignmentId)) {
                return session;
            }
        }
        
        return null;
    }

    // Helper methods

    private SlotSession validateSessionForBooking(Long sessionId) {
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("Session not found");
        }
        
        if (session.getStatus() != SessionStatus.AVAILABLE) {
            throw new BusinessException("Session not available");
        }
        
        return session;
    }



    private void checkSessionAvailability(Long sessionId) {
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (!session.getStatus().equals(SessionStatus.AVAILABLE)) {
            throw new BusinessException("Session already booked");
        }
    }

    private SlotSession validateSessionOwnership(Long sessionId, Long studentId, Long assignmentId) {
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("Session not found");
        }
        
        if (session.getStatus() != SessionStatus.BOOKED) {
            throw new BusinessException("Session is not booked");
        }
        
        // Check if student owns this booking
        if ("student".equals(session.getBookedSubjectType()) && 
            !studentId.equals(session.getBookedSubjectId())) {
            throw new BusinessException("Session does not belong to student");
        }
        
        // For group bookings, we'd need to check if student is in the group
        // This is simplified for now
        
        return session;
    }

    private BookableSessionsResponseDTO.TimeSlotWithSessionsDTO buildTimeSlotWithSessions(TimeSlot slot, Boolean includeReasons) {
        BookableSessionsResponseDTO.TimeSlotWithSessionsDTO timeSlotDTO = new BookableSessionsResponseDTO.TimeSlotWithSessionsDTO();
        timeSlotDTO.setSlotId(slot.getSlotId());
        timeSlotDTO.setStart(slot.getStartAt().toString());
        timeSlotDTO.setEnd(slot.getEndAt().toString());
        timeSlotDTO.setTimezone("Australia/Melbourne"); // Default timezone
        timeSlotDTO.setRequiredExaminers(slot.getRequiredExaminers());
        timeSlotDTO.setCurrentExaminers(slot.getCurrentExaminers());
        timeSlotDTO.setIsFullyStaffed(slot.getCurrentExaminers() >= slot.getRequiredExaminers());

        // Get venue info
        Venue venue = venueMapper.selectById(slot.getVenueId());
        if (venue != null) {
            BookableSessionsResponseDTO.VenueInfoDTO venueDTO = new BookableSessionsResponseDTO.VenueInfoDTO();
            venueDTO.setId(venue.getId());
            venueDTO.setVenueName(venue.getRoomName());
            venueDTO.setAssignmentId(venue.getAssignmentId());
            timeSlotDTO.setVenue(venueDTO);
        }

        // Get sessions
        List<SlotSession> sessions = slotSessionMapper.findBySlotId(slot.getSlotId());
        List<BookableSessionsResponseDTO.SessionAvailabilityDTO> sessionDTOs = new ArrayList<>();
        
        for (SlotSession session : sessions) {
            BookableSessionsResponseDTO.SessionAvailabilityDTO sessionDTO = new BookableSessionsResponseDTO.SessionAvailabilityDTO();
            sessionDTO.setSessionId(session.getSessionId());
            sessionDTO.setStart(session.getStartAt().toString());
            sessionDTO.setEnd(session.getEndAt().toString());
            
            BookableSessionsResponseDTO.AvailabilityDetailsDTO availability = new BookableSessionsResponseDTO.AvailabilityDetailsDTO();
            
            if (session.getStatus() == SessionStatus.AVAILABLE) {
                sessionDTO.setStatus("available");
                availability.setCanBook(true);
            } else {
                sessionDTO.setStatus("unavailable");
                availability.setCanBook(false);
                if (Boolean.TRUE.equals(includeReasons)) {
                    if (session.getStatus() == SessionStatus.BOOKED) {
                        availability.setReason("SESSION_TAKEN");
                    } else if (session.getStatus() == SessionStatus.BLOCKED) {
                        availability.setReason("SESSION_BLOCKED");
                    }
                }
            }
            
            sessionDTO.setAvailability(availability);
            sessionDTOs.add(sessionDTO);
        }
        
        timeSlotDTO.setSessions(sessionDTOs);
        return timeSlotDTO;
    }

    private CreateBookingResponseDTO buildCreateBookingResponse(SlotSession session, Assignment assignment, CreateBookingRequestDTO request) {
        CreateBookingResponseDTO response = new CreateBookingResponseDTO();
        response.setBookingId(session.getSessionId()); // Using sessionId as bookingId
        response.setAssignmentId(assignment.getId());

        // Set entity info
        CreateBookingResponseDTO.EntityInfoDTO entityInfo = new CreateBookingResponseDTO.EntityInfoDTO();
        entityInfo.setType(assignment.getType());
        entityInfo.setGroupId(request.getGroupId());
        response.setEntity(entityInfo);

        // Set session info
        CreateBookingResponseDTO.SessionInfoDTO sessionInfo = new CreateBookingResponseDTO.SessionInfoDTO();
        sessionInfo.setSessionId(session.getSessionId());
        sessionInfo.setSlotId(session.getSlotId());
        sessionInfo.setStart(session.getStartAt().toString());
        sessionInfo.setEnd(session.getEndAt().toString());
        sessionInfo.setTimezone("Australia/Melbourne");

        // Get venue info
        TimeSlot timeSlot = timeSlotMapper.selectById(session.getSlotId());
        if (timeSlot != null) {
            Venue venue = venueMapper.selectById(timeSlot.getVenueId());
            if (venue != null) {
                CreateBookingResponseDTO.VenueInfoDTO venueInfo = new CreateBookingResponseDTO.VenueInfoDTO();
                venueInfo.setVenueId(venue.getId());
                venueInfo.setName(venue.getRoomName());
                venueInfo.setAssignmentId(venue.getAssignmentId());
                sessionInfo.setVenue(venueInfo);
            }
        }
        
        response.setSession(sessionInfo);

        // Set notifications
        CreateBookingResponseDTO.NotificationsDTO notifications = new CreateBookingResponseDTO.NotificationsDTO();
        notifications.setEmailQueued(true);
        notifications.setIcsUrl("/api/calendar/booking/" + session.getSessionId() + ".ics");
        response.setNotifications(notifications);

        return response;
    }

    private CurrentBookingResponseDTO.BookingInfoDTO buildCurrentBookingInfo(SlotSession session, Assignment assignment) {
        CurrentBookingResponseDTO.BookingInfoDTO bookingInfo = new CurrentBookingResponseDTO.BookingInfoDTO();
        bookingInfo.setBookingId(session.getSessionId()); // Using sessionId as bookingId
        bookingInfo.setReschedulingEnabled(true); // Default values
        bookingInfo.setLockoutEnabled(true);
        bookingInfo.setLockoutWindowHours(24);
        
        // Set booking deadline to assignment end date
        if (assignment.getEndDate() != null) {
            bookingInfo.setBookingDeadline(assignment.getEndDate().toString());
        }

        // Set entity info
        CurrentBookingResponseDTO.EntityInfoDTO entityInfo = new CurrentBookingResponseDTO.EntityInfoDTO();
        entityInfo.setType(assignment.getType());
        if ("GROUP".equals(session.getBookedSubjectType())) {
            entityInfo.setGroupId(session.getBookedSubjectId());
        }
        bookingInfo.setEntity(entityInfo);

        // Set session info
        CurrentBookingResponseDTO.SessionInfoDTO sessionInfo = new CurrentBookingResponseDTO.SessionInfoDTO();
        sessionInfo.setSessionId(session.getSessionId());
        sessionInfo.setStart(session.getStartAt().toString());
        sessionInfo.setEnd(session.getEndAt().toString());
        sessionInfo.setTimezone("Australia/Melbourne");

        // Get slot and venue info
        TimeSlot timeSlot = timeSlotMapper.selectById(session.getSlotId());
        if (timeSlot != null) {
            sessionInfo.setSlotId(timeSlot.getSlotId());
            
            Venue venue = venueMapper.selectById(timeSlot.getVenueId());
            if (venue != null) {
                CurrentBookingResponseDTO.VenueInfoDTO venueInfo = new CurrentBookingResponseDTO.VenueInfoDTO();
                venueInfo.setVenueName(venue.getRoomName());
                venueInfo.setId(venue.getId());
                venueInfo.setAssignmentId(venue.getAssignmentId());
                sessionInfo.setVenue(venueInfo);
            }
        }
        
        bookingInfo.setSession(sessionInfo);

        return bookingInfo;
    }

    /**
     * Get the group ID for a student in a specific assignment
     * @param studentId the student ID
     * @param assignmentId the assignment ID
     * @return the group ID if student belongs to a group, null otherwise
     */
    private Long getStudentGroupId(Long studentId, Long assignmentId) {
        // TODO 加上assignmentid

        // Check if student belongs to a group for this assignment
        LambdaQueryWrapper<SysStudentGroup> studentGroupQuery = new LambdaQueryWrapper<>();
        studentGroupQuery.eq(SysStudentGroup::getUserId, studentId);
        SysStudentGroup studentGroup = sysStudentGroupMapper.selectOne(studentGroupQuery);
        
        return studentGroup != null ? studentGroup.getGroupId() : null;
    }
}
