package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
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
    private final GroupMapper groupMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;

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
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, date, null);
        
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
        // Validate assignment exists and is released
        Assignment assignment = validateAssignmentForBooking(assignmentId);
        
        // Validate student exists
        SysStudent student = sysStudentMapper.selectById(request.getStudentId());
        if (student == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }

        // Validate session exists and is available
        SlotSession session = validateSessionForBooking(request.getSessionId());
        
        // Validate group if required
        if ("group".equals(assignment.getType()) || "mixed".equals(assignment.getType())) {
            if (request.getGroupId() == null) {
                throw new BusinessException("Group ID is required for GROUP/MIXED assignments");
            }
            validateGroupForStudent(request.getGroupId(), request.getStudentId());
        }

        // Check if student/group already has an active booking
        checkExistingBooking(request.getStudentId(), assignmentId, request.getGroupId());

        // Check if session is already booked
        checkSessionAvailability(request.getSessionId());

        // Update session to booked status
        String bookedSubjectType = (request.getGroupId() != null) ? "group" : "student";
        Long bookedSubjectId = (request.getGroupId() != null) ? request.getGroupId() : request.getStudentId();
        
        session.setStatus(SessionStatus.BOOKED);
        session.setBookedSubjectId(bookedSubjectId);
        session.setBookedSubjectType(bookedSubjectType);
        session.setBookedAt(LocalDateTime.now());
        slotSessionMapper.updateById(session);

        // Build response
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
            List<SlotSession> studentBookings = slotSessionMapper.findActiveBookingsByStudent(studentId, assignmentId);
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

        // Update current session to available
        currentSession.setStatus(SessionStatus.AVAILABLE);
        slotSessionMapper.updateById(currentSession);

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
        // Validate session is booked by the student
        SlotSession session = validateSessionOwnership(sessionId, studentId, assignmentId);
        
        // Update session to available
        session.setStatus(SessionStatus.AVAILABLE);
        slotSessionMapper.updateById(session);

        return sessionId;
    }

    @Override
    public List<SlotSession> findActiveBookingByStudent(Long studentId, Long assignmentId) {
        // Use optimized query to find all active bookings for the student in the assignment
        return slotSessionMapper.findActiveBookingsByStudent(studentId, assignmentId);
    }

    @Override
    public List<SlotSession> findAvailableSessionsByAssignment(Long assignmentId) {
        // Use the optimized mapper method to find all available sessions for the assignment
        return slotSessionMapper.findAvailableSessionsByAssignment(assignmentId);
    }

    @Override
    public SlotSession findActiveBookingByGroup(Long groupId, Long assignmentId) {
        // Find sessions booked by this group in this assignment
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, null, null);
        
        for (TimeSlot slot : timeSlots) {
            List<SlotSession> slotSessions = slotSessionMapper.findBySlotId(slot.getSlotId());
            for (SlotSession session : slotSessions) {
                if (session.getStatus() == SessionStatus.BOOKED && 
                    "GROUP".equals(session.getBookedSubjectType()) &&
                    groupId.equals(session.getBookedSubjectId())) {
                    return session;
                }
            }
        }
        
        return null;
    }

    // Helper methods
    private Assignment validateAssignmentForBooking(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        if (!Boolean.TRUE.equals(assignment.getIsReleased())) {
            throw new BusinessException("Assignment schedule not released");
        }
        
        return assignment;
    }

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

    private void validateGroupForStudent(Long groupId, Long studentId) {
        // This would need to be implemented based on how groups are associated with students
        // For now, we'll assume the group exists
        SysGroup group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new BusinessException("Group not found");
        }
    }

    private void checkExistingBooking(Long studentId, Long assignmentId, Long groupId) {
        // 第一个检查：这个studentId有没有个人预定过
        List<SlotSession> studentBookings = findActiveBookingByStudent(studentId, assignmentId);
        if (!studentBookings.isEmpty()) {
            throw new BusinessException("Student already has an individual booking for this assignment");
        }
        
        // 第二个检查：studentId所在的全部组有没有预定过
        Long studentGroupId = getStudentGroupId(studentId, assignmentId);
        if (studentGroupId != null) {
            SlotSession groupBooking = findActiveBookingByGroup(studentGroupId, assignmentId);
            if (groupBooking != null) {
                throw new BusinessException("Student's group already has a booking for this assignment");
            }
        }
        
        // 第三个检查：如果当前是组预定，检查该组是否已经预定过
        if (groupId != null) {
            boolean groupHasBooking = slotSessionMapper.hasGroupBookedAssignment(groupId, assignmentId);
            if (groupHasBooking) {
                throw new BusinessException("Group already has a booking for this assignment");
            }
        }
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
