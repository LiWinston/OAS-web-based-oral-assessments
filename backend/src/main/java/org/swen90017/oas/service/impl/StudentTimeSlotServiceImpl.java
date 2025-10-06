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
    private final SlotSessionMapper slotSessionMapper;
    private final VenueMapper venueMapper;
    private final SysStudentMapper sysStudentMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SessionStudentMapper sessionStudentMapper;
    private final GroupMapper groupMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;

    @Override
    public BookableSessionsResponseDTO getBookableSessions(Long assignmentId, Long studentId, 
                                                         LocalDate date, Integer pageNum, 
                                                         Integer pageSize, Boolean includeReasons) {
        // Validate assignment exists
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        // Check if the requested date is within assignment time range
        LocalDate assignmentStartDate = assignment.getStartDate() != null ? assignment.getStartDate().toLocalDate() : null;
        LocalDate assignmentEndDate = assignment.getEndDate() != null ? assignment.getEndDate().toLocalDate() : null;
        
        if (assignmentStartDate != null && date.isBefore(assignmentStartDate)) {
            throw new BusinessException("Requested date is before assignment start date", "DATE_BEFORE_ASSIGNMENT_START");
        }
        
        if (assignmentEndDate != null && date.isAfter(assignmentEndDate)) {
            throw new BusinessException("Requested date is after assignment end date", "DATE_AFTER_ASSIGNMENT_END");
        }

        // Get sessions directly for the assignment and date
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(
            assignmentId, date.atStartOfDay(), date.atTime(23, 59, 59));
        
        // Filter out understaffed sessions and group by slot
        sessions = sessions.stream().collect(Collectors.toList());

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

        // Build session DTOs directly
        List<BookableSessionsResponseDTO.SessionAvailabilityDTO> sessionDTOs = buildSessionDTOsFromSessions(sessions, includeReasons);
        response.setSessions(sessionDTOs);

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
        
        // Get assignment to determine type
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Determine booking type and subject ID
        String bookingType = "INDIVIDUAL";
        Long subjectId = request.getStudentId();
        
        if (request.getGroupId() != null) {
            // If assignment type is "mixed", use MIX type; otherwise use GROUP
            if ("mixed".equalsIgnoreCase(assignment.getType())) {
                bookingType = "MIX";
            } else {
                bookingType = "GROUP";
            }
            subjectId = request.getGroupId();
        }

        // Check if already booked for this assignment (prevent duplicate assignment bookings)
        if (bookingType.equals("INDIVIDUAL")) {
            boolean hasBookedAssignment = slotSessionMapper.hasStudentBookedAssignment(request.getStudentId(), assignmentId);
            if (hasBookedAssignment) {
                throw new BusinessException(BusinessError.ALREADY_BOOKED);
            }
        } else {
            boolean hasBookedAssignment = slotSessionMapper.hasGroupBookedAssignment(request.getGroupId(), assignmentId);
            if (hasBookedAssignment) {
                throw new BusinessException(BusinessError.ALREADY_BOOKED);
            }
        }

        // Check if already booked for this specific session
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

        // Build response (assignment already retrieved above)
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
        // Validate current session exists
        SlotSession currentSession = slotSessionMapper.selectById(sessionId);
        if (currentSession == null) {
            throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        }
        
        // Check if target session is available
        checkSessionAvailability(request.getTargetSessionId());

        // Find the existing booking record by sessionId to determine booking type
        List<SessionStudent> sessionBookings = sessionStudentMapper.listBySession(sessionId);
        if (sessionBookings.isEmpty()) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        SessionStudent existingBooking = sessionBookings.get(0); // Should only be one booking per session
        String bookingType = existingBooking.getType();
        Long subjectId;
        
        if ("INDIVIDUAL".equals(bookingType)) {
            // For individual bookings, use the existing subjectId directly
            subjectId = existingBooking.getSubjectId();
            
            // Validate that the student making the request owns this individual booking
            if (!request.getStudentId().equals(subjectId)) {
                throw new BusinessException("Student does not own this booking");
            }
        } else if ("GROUP".equals(bookingType) || "MIX".equals(bookingType)) {
            // For group and mix bookings, find the group ID using studentId and assignmentId
            Long studentGroupId = getStudentGroupId(request.getStudentId(), assignmentId);
            if (studentGroupId == null) {
                throw new BusinessException("Student is not part of any group for this assignment");
            }
            
            // Validate that the existing booking belongs to the student's group
            if (!studentGroupId.equals(existingBooking.getSubjectId())) {
                throw new BusinessException("Student is not part of the group that owns this booking");
            }
            
            subjectId = studentGroupId;
        } else {
            throw new BusinessException("Invalid booking type: " + bookingType);
        }

        // Update the session_student record to point to the new session
        existingBooking.setSessionId(request.getTargetSessionId());
        existingBooking.setBookedTime(LocalDateTime.now());
        sessionStudentMapper.updateById(existingBooking);

        // Decrement current session count
        slotSessionMapper.decrementBookedIfExists(sessionId);
        
        // Increment target session count
        int updated = slotSessionMapper.incrementBookedIfAvailable(request.getTargetSessionId());
        if (updated == 0) {
            throw new BusinessException(BusinessError.SESSION_CONFLICT);
        }

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
        // First try to find individual booking for this student
        SessionStudent existingBooking = sessionStudentMapper.selectBySessionAndSubject(
            sessionId, "INDIVIDUAL", studentId);
        
        // If no individual booking found, check for group booking
        if (existingBooking == null) {
            // Find the group ID for this student and assignment
            Long studentGroupId = getStudentGroupId(studentId, assignmentId);
            if (studentGroupId != null) {
                existingBooking = sessionStudentMapper.selectBySessionAndSubject(
                    sessionId, "GROUP", studentGroupId);
            }
        }
        
        // If no booking found for this student
        if (existingBooking == null) {
            throw new BusinessException(CommonError.NOT_FOUND);
        }
        
        // Validate ownership based on booking type
        String bookingType = existingBooking.getType();
        if ("INDIVIDUAL".equals(bookingType)) {
            // For individual bookings, validate that the student making the request owns this booking
            if (!studentId.equals(existingBooking.getSubjectId())) {
                throw new BusinessException("Student does not own this booking");
            }
        } else if ("GROUP".equals(bookingType) || "MIX".equals(bookingType)) {
            // For group and mix bookings, find the group ID using studentId and assignmentId
            Long studentGroupId = getStudentGroupId(studentId, assignmentId);
            if (studentGroupId == null) {
                throw new BusinessException("Student is not part of any group for this assignment");
            }
            
            // Validate that the existing booking belongs to the student's group
            if (!studentGroupId.equals(existingBooking.getSubjectId())) {
                throw new BusinessException("Student is not part of the group that owns this booking");
            }
        } else {
            throw new BusinessException("Invalid booking type: " + bookingType);
        }
        
        // Check if there are any submitted assessments for this session
        Long submittedCount = assessmentSubmissionMapper.countSubmittedAssessmentsBySession(sessionId);
        if (submittedCount != null && submittedCount > 0) {
            throw new BusinessException("Cannot cancel booking: this session has submitted assessments");
        }
        
        // Delete the booking record
        sessionStudentMapper.deleteById(existingBooking.getId());
        
        // Decrement enrolled_groups count in slot_sessions
        slotSessionMapper.decrementBookedIfExists(sessionId);

        return sessionId;
    }

    @Override
    public List<SlotSession> findActiveBookingByStudent(Long studentId, Long assignmentId) {
        List<SlotSession> sessions = new ArrayList<>();
        
        // 1. Find individual bookings from session_student table
        List<SessionStudent> individualBookings = sessionStudentMapper.listBySubject("INDIVIDUAL", studentId);
        
        // Get the corresponding slot sessions for individual bookings
        for (SessionStudent booking : individualBookings) {
            SlotSession session = slotSessionMapper.selectById(booking.getSessionId());
            if (session != null && session.getAssignmentId().equals(assignmentId)) {
                sessions.add(session);
            }
        }
        
        // 2. Find group bookings - check if student belongs to a group for this assignment
        Long groupId = getStudentGroupId(studentId, assignmentId);
        if (groupId != null) {
            List<SessionStudent> groupBookings = sessionStudentMapper.listBySubject("GROUP", groupId);
            
            // Get the corresponding slot sessions for group bookings
            for (SessionStudent booking : groupBookings) {
                SlotSession session = slotSessionMapper.selectById(booking.getSessionId());
                if (session != null && session.getAssignmentId().equals(assignmentId)) {
                    sessions.add(session);
                }
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
        
        return session;
    }



    private void checkSessionAvailability(Long sessionId) {
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException("Session not found");
        }
        
        // Check if session has reached capacity
        if (session.getEnrolledGroups() != null && session.getCapacityGroups() != null) {
            if (session.getEnrolledGroups() >= session.getCapacityGroups()) {
                throw new BusinessException("Session is full");
            }
        }
    }


    private List<BookableSessionsResponseDTO.SessionAvailabilityDTO> buildSessionDTOsFromSessions(List<SlotSession> sessions, Boolean includeReasons) {
        List<BookableSessionsResponseDTO.SessionAvailabilityDTO> sessionDTOs = new ArrayList<>();
        
        for (SlotSession session : sessions) {
            BookableSessionsResponseDTO.SessionAvailabilityDTO sessionDTO = new BookableSessionsResponseDTO.SessionAvailabilityDTO();
            sessionDTO.setSessionId(session.getSessionId());
            sessionDTO.setStart(session.getStartAt().toString());
            sessionDTO.setEnd(session.getEndAt().toString());
            
            // Set venue information
            if (session.getVenueId() != null) {
                Venue venue = venueMapper.selectById(session.getVenueId());
                if (venue != null) {
                    BookableSessionsResponseDTO.VenueInfoDTO venueInfo = new BookableSessionsResponseDTO.VenueInfoDTO();
                    venueInfo.setId(venue.getId());
                    venueInfo.setVenueName(venue.getRoomName());
                    venueInfo.setAssignmentId(venue.getAssignmentId());
                    sessionDTO.setVenue(venueInfo);
                }
            }
            
            BookableSessionsResponseDTO.AvailabilityDetailsDTO availability = new BookableSessionsResponseDTO.AvailabilityDetailsDTO();
            
            if (session.getCapacityGroups() > session.getEnrolledGroups()) {
                sessionDTO.setStatus("available");
                availability.setCanBook(true);
            } else {
                sessionDTO.setStatus("unavailable");
                availability.setCanBook(false);
                if (Boolean.TRUE.equals(includeReasons)) {
                    availability.setReason("Session full booked");
                }
            }
            
            sessionDTO.setAvailability(availability);
            sessionDTOs.add(sessionDTO);
        }
        
        // Sort by start time
        sessionDTOs.sort((a, b) -> a.getStart().compareTo(b.getStart()));
        
        return sessionDTOs;
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

        // Get venue info directly from session's venueId
        if (session.getVenueId() != null) {
            Venue venue = venueMapper.selectById(session.getVenueId());
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
        sessionInfo.setSlotId(session.getSlotId());

        // Get venue info directly from session's venueId
        if (session.getVenueId() != null) {
            Venue venue = venueMapper.selectById(session.getVenueId());
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
        // Directly query for the group that matches both student ID and assignment ID
        SysGroup group = groupMapper.selectByStudentIdAndAssignmentId(studentId, assignmentId);
        if (group != null) {
            return group.getGroupId();
        }
        
        // For backward compatibility, check if any group has bookings for this assignment
        LambdaQueryWrapper<SysStudentGroup> studentGroupQuery = new LambdaQueryWrapper<>();
        studentGroupQuery.eq(SysStudentGroup::getUserId, studentId);
        List<SysStudentGroup> studentGroups = sysStudentGroupMapper.selectList(studentGroupQuery);
        
        for (SysStudentGroup studentGroup : studentGroups) {
            boolean hasBookingForAssignment = slotSessionMapper.hasGroupBookedAssignment(
                studentGroup.getGroupId(), assignmentId);
            
            if (hasBookingForAssignment) {
                return studentGroup.getGroupId();
            }
        }
        
        return null;
    }
}
