package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.RubricsInfoDto;
import org.swen90017.oas.dto.request.ExaminerBulkAssignRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleResponseDTO;
import org.swen90017.oas.dto.response.ExaminerUnassignResponseDTO;
import org.swen90017.oas.dto.response.PartialAssignmentResultDTO;
import org.swen90017.oas.dto.response.SelectableTimeSlotDTO;
import org.swen90017.oas.dto.response.TimeSlotsSelectionResponseDTO;
import org.swen90017.oas.dto.response.SessionStudentsResponseDTO;
import org.swen90017.oas.dto.response.SessionStudentsSimpleResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.AssessmentStatus;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.ExaminerSelfService;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminerSelfServiceImpl implements ExaminerSelfService {

    private final AssignmentMapper assignmentMapper;
    private final AssignmentSessionConfigMapper configMapper;
    private final AssignmentParticipantMapper participantMapper;
    private final TimeSlotMapper timeSlotMapper;
    private final SessionExaminerMapper sessionExaminerMapper;
    private final TimeSlotExaminersMapper tseMapper;
    private final SubjectService subjectService;
    private final VenueMapper venueMapper;
    private final ExaminerAssignmentLimitMapper examinerAssignmentLimitMapper;
    private final SysUserMapper sysUserMapper;
    private final SessionStudentMapper sessionStudentMapper;
    private final SysStudentMapper sysStudentMapper;
    private final GroupMapper groupMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;
    private final SlotSessionMapper slotSessionMapper;

    @Override
    public List<AssignmentResponseDTO> listAssignmentsAvailable(Long examinerId, Long courseId, String sort) {
        // Validate that the examiner exists and has EXAMINER role
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        // First, fetch assignment IDs that this examiner participates in
        List<Long> participantAssignmentIds = participantMapper.listAssignmentIdsByExaminer(examinerId);
        if (participantAssignmentIds == null || participantAssignmentIds.isEmpty()) {
            // If the examiner doesn't participate in any assignments, return empty list
            return Collections.emptyList();
        }
        
        // Build query conditions: only query assignments the examiner participates in
        QueryWrapper<Assignment> queryWrapper = new QueryWrapper<>();
        queryWrapper.in("id", participantAssignmentIds);
        queryWrapper.ne("status", "PENDING"); // Exclude assignments with PENDING status
        
        // Add course filter
        if (courseId != null) {
            queryWrapper.eq("subject_id", courseId);
        }
        
        // Add sorting
        if (sort != null) {
            switch (sort.toLowerCase()) {
                case "date_asc":
                    queryWrapper.orderByAsc("start_date");
                    break;
                case "date_desc":
                    queryWrapper.orderByDesc("start_date");
                    break;
                default:
                    queryWrapper.orderByDesc("start_date"); // Default sorting
                    break;
            }
        } else {
            queryWrapper.orderByDesc("start_date"); // Default sorting
        }
        
        List<Assignment> participantAssignments = assignmentMapper.selectList(queryWrapper);
        return participantAssignments.stream().map(this::toAssignmentDTO).collect(Collectors.toList());
    }

    @Override
    public TimeSlotsSelectionResponseDTO listSelectableTimeSlots(Long assignmentId, Long examinerId, String date, Boolean includeFullSlots) {
        // Validate that the examiner exists and has EXAMINER role
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        // Build response DTO
        TimeSlotsSelectionResponseDTO response = new TimeSlotsSelectionResponseDTO();
        
        // 1) Get Assignment information
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        TimeSlotsSelectionResponseDTO.AssignmentBasicInfoDTO assignmentInfo = new TimeSlotsSelectionResponseDTO.AssignmentBasicInfoDTO();
        assignmentInfo.setAssignmentId(assignmentId);
        assignmentInfo.setAssignmentName(assignment.getName());
        assignmentInfo.setAssessmentType(assignment.getType() != null ? assignment.getType().toUpperCase() : "INDIVIDUAL");
        
        // Get course information
        if (assignment.getSubjectId() != null) {
            try {
                Subject subject = subjectService.getSubjectById(assignment.getSubjectId());
                if (subject != null) {
                    assignmentInfo.setCourseCode(subject.getSubjectCode());
                    assignmentInfo.setCourseName(subject.getSubjectName());
                }
            } catch (BusinessException ex) {
                assignmentInfo.setCourseCode("N/A");
                assignmentInfo.setCourseName("Course Unavailable");
            }
        }
        response.setAssignment(assignmentInfo);
        
        // 2) Get examiner capacity information
        TimeSlotsSelectionResponseDTO.ExaminerCapacityInfoDTO examinerInfo = new TimeSlotsSelectionResponseDTO.ExaminerCapacityInfoDTO();
        
        // Look up examiner limit
        QueryWrapper<ExaminerAssignmentLimit> limitQuery = new QueryWrapper<>();
        limitQuery.eq("examiner_id", examinerId).eq("assignment_id", assignmentId);
        ExaminerAssignmentLimit limit = examinerAssignmentLimitMapper.selectOne(limitQuery);
        
        int maxSessions = 10; // Default value
        if (limit != null && limit.getMaxSessions() != null) {
            maxSessions = limit.getMaxSessions();
        }
        
        // Calculate the number of sessions currently assigned
        int currentAssigned = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, examinerId);
        
        examinerInfo.setMaxSessions(maxSessions);
        examinerInfo.setCurrentAssignedSessions(currentAssigned);
        examinerInfo.setRemainingCapacity(Math.max(0, maxSessions - currentAssigned));
        response.setExaminerInfo(examinerInfo);
        
        // 3) Get time slot information
        List<TimeSlot> slots = timeSlotMapper.listByAssignment(assignmentId);
        Set<Long> alreadyAssigned = new HashSet<>(tseMapper.listSlotsByExaminer(examinerId, assignmentId)
                .stream().map(TimeSlot::getSlotId).collect(Collectors.toSet()));

        // Parse date filter parameter
        LocalDate filterDate = null;
        if (date != null && !date.trim().isEmpty()) {
            try {
                filterDate = LocalDate.parse(date);
            } catch (Exception e) {
                // Ignore invalid date formats; skip date filtering
            }
        }

        List<TimeSlotsSelectionResponseDTO.TimeSlotSelectionDTO> timeSlotDTOs = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");
        ZoneId timezone = ZoneId.of("Australia/Melbourne");
        
        for (TimeSlot ts : slots) {
            // Date filtering
            if (filterDate != null && ts.getStartAt() != null) {
                LocalDate slotDate = ts.getStartAt().toLocalDate();
                if (!slotDate.equals(filterDate)) {
                    continue;
                }
            }

            boolean isFull = ts.getCurrentExaminers() != null && ts.getRequiredExaminers() != null
                    && ts.getCurrentExaminers() >= ts.getRequiredExaminers();
            
            // Full-capacity filter: skip if includeFullSlots=false and slot is already full
            if (includeFullSlots != null && !includeFullSlots && isFull) {
                continue;
            }
            
            TimeSlotsSelectionResponseDTO.TimeSlotSelectionDTO slotDTO = new TimeSlotsSelectionResponseDTO.TimeSlotSelectionDTO();
            slotDTO.setSlotId(ts.getSlotId());
            
            // Format time
            if (ts.getStartAt() != null) {
                slotDTO.setStart(ts.getStartAt().atZone(timezone).format(formatter));
            }
            if (ts.getEndAt() != null) {
                slotDTO.setEnd(ts.getEndAt().atZone(timezone).format(formatter));
            }
            slotDTO.setTimezone("Australia/Melbourne");
            
            // Set venue information
            TimeSlotsSelectionResponseDTO.VenueInfoDTO venueDTO = new TimeSlotsSelectionResponseDTO.VenueInfoDTO();
            if (ts.getVenueId() != null) {
                Venue venue = venueMapper.selectById(ts.getVenueId());
                if (venue != null) {
                    venueDTO.setVenueId(venue.getId());
                    venueDTO.setName(venue.getRoomName());
                    venueDTO.setAssignmentId(venue.getAssignmentId());
                }
            }
            slotDTO.setVenue(venueDTO);
            
            slotDTO.setSessionCount(ts.getSessionCount() != null ? ts.getSessionCount() : 0);
            slotDTO.setRequiredExaminers(ts.getRequiredExaminers() != null ? ts.getRequiredExaminers() : 1);
            slotDTO.setCurrentExaminers(ts.getCurrentExaminers() != null ? ts.getCurrentExaminers() : 0);
            slotDTO.setIsFull(isFull);
            
            // Set availability
            TimeSlotsSelectionResponseDTO.AvailabilityInfoDTO availability = new TimeSlotsSelectionResponseDTO.AvailabilityInfoDTO();
            boolean isAssigned = alreadyAssigned.contains(ts.getSlotId());
            boolean hasConflict = !tseMapper.findConflictedSlotsForExaminer(examinerId, ts.getStartAt(), ts.getEndAt()).isEmpty();
            
            boolean canSelect = !isAssigned && !hasConflict && !isFull;
            availability.setCanSelect(canSelect);
            
            if (!canSelect) {
                if (isAssigned) {
                    availability.setReason("ALREADY_ASSIGNED");
                } else if (hasConflict) {
                    availability.setReason("TIME_CONFLICT");
                } else if (isFull) {
                    availability.setReason("SLOT_FULL");
                }
            }
            
            slotDTO.setAvailability(availability);
            timeSlotDTOs.add(slotDTO);
        }
        
        response.setTimeSlots(timeSlotDTOs);
        return response;
    }

    @Override
    @Transactional
    public PartialAssignmentResultDTO bulkAssign(Long assignmentId, ExaminerBulkAssignRequestDTO request) {
        Long examinerId = request.getExaminerId();
        
        // Validate that the examiner exists and has EXAMINER role
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        // 1) Validate that the examiner belongs to the assignment (has participation relation)
        AssignmentParticipant rel = participantMapper.selectOne(new QueryWrapper<AssignmentParticipant>()
                .eq("assignment_id", assignmentId).eq("user_id", examinerId).last("limit 1"));
        if (rel == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // 2) Read maxSessions configuration - prefer personalized limit, otherwise use default
        ExaminerAssignmentLimit personalLimit = examinerAssignmentLimitMapper.findByExaminerAndAssignment(examinerId, assignmentId);
        Integer maxSessions = null;
        
        if (personalLimit != null && personalLimit.getMaxSessions() != null) {
            // Use personalized limit
            maxSessions = personalLimit.getMaxSessions();
        } else {
            // Use default configuration
            AssignmentSessionConfig cfg = configMapper.selectById(assignmentId);
            maxSessions = cfg == null ? null : cfg.getDefaultMaxSessionsPerExaminer();
        }

        // 3) Count already-assigned sessions
        int currentSessions = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, examinerId);

        PartialAssignmentResultDTO result = new PartialAssignmentResultDTO();

        for (Long slotId : request.getSlotIds()) {
            TimeSlot ts = timeSlotMapper.selectById(slotId);
            if (ts == null || !Objects.equals(ts.getAssignmentId(), assignmentId)) {
                addFailure(result, slotId, "slot_not_found");
                continue;
            }
            if (Boolean.TRUE.equals(ts.getBookingOpen()) == Boolean.FALSE) {
            // If there is an open switch and it's off, treat as not selectable
            }
            // Capacity
            if (ts.getCurrentExaminers() != null && ts.getRequiredExaminers() != null
                    && ts.getCurrentExaminers() >= ts.getRequiredExaminers()) {
                addFailure(result, slotId, "slot_full");
                continue;
            }
            // Conflict
            if (!tseMapper.findConflictedSlotsForExaminer(examinerId, ts.getStartAt(), ts.getEndAt()).isEmpty()) {
                addFailure(result, slotId, "time_conflict");
                continue;
            }
            // maxSessions
            if (maxSessions != null && maxSessions > 0) {
                int after = currentSessions + (ts.getSessionCount() == null ? 0 : ts.getSessionCount());
                if (after > maxSessions) {
                    addFailure(result, slotId, "max_sessions_exceeded");
                    continue;
                }
            }

            // Perform assignment: insert relation and update counters
            TimeSlotExaminer link = new TimeSlotExaminer();
            link.setSlotId(slotId);
            link.setExaminerId(examinerId);
            link.setAssignedAt(LocalDateTime.now());
            link.setAssignedBy(examinerId);
            tseMapper.insert(link);

            int newCurrent = (ts.getCurrentExaminers() == null ? 0 : ts.getCurrentExaminers()) + 1;
            int booked = ts.getBookedSessions() == null ? 0 : ts.getBookedSessions();
            timeSlotMapper.updateCountersAndStatus(slotId, newCurrent, booked);

            currentSessions += (ts.getSessionCount() == null ? 0 : ts.getSessionCount());
            result.getSuccess().add(slotId);
        }

        return result;
    }

    @Override
    public ExaminerScheduleDTO getSchedule(Long examinerId, Long assignmentId) {
        List<TimeSlot> slots = tseMapper.listSlotsByExaminer(examinerId, assignmentId);
        ExaminerScheduleDTO dto = new ExaminerScheduleDTO();
        dto.setExaminerId(examinerId);
        dto.setAssignmentId(assignmentId);
        dto.setSlots(slots.stream().map(this::toAssigned).collect(Collectors.toList()));
        return dto;
    }

    @Override
    public ExaminerScheduleResponseDTO getScheduleV2(Long examinerId, Long assignmentId) {
        // Validate that the examiner exists and has EXAMINER role
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        List<SlotSession> sessions = sessionExaminerMapper.listSessionsByExaminer(examinerId, assignmentId);
        Map<Long, List<SlotSession>> byAssignment = sessions.stream().collect(Collectors.groupingBy(SlotSession::getAssignmentId));

        List<ExaminerScheduleResponseDTO.AssignmentScheduleDTO> assignments = new ArrayList<>();
        for (Map.Entry<Long, List<SlotSession>> e : byAssignment.entrySet()) {
            Long aId = e.getKey();
            Assignment a = assignmentMapper.selectById(aId);
            ExaminerScheduleResponseDTO.AssignmentScheduleDTO as = new ExaminerScheduleResponseDTO.AssignmentScheduleDTO();
            as.setAssignmentId(aId);
            as.setAssignmentName(a != null ? a.getName() : null);

            // Add course information
            if (a != null && a.getSubjectId() != null) {
                try {
                    Subject subj = subjectService.getSubjectById(a.getSubjectId());
                    if (subj != null) {
                        as.setCourseCode(subj.getSubjectCode());
                        as.setCourseName(subj.getSubjectName());
                    }
                } catch (BusinessException ex) {
                    // If course does not exist or was deleted, set default values and continue
                    as.setCourseCode("N/A");
                    as.setCourseName("Course Unavailable");
                }
            }

            List<ExaminerScheduleResponseDTO.SessionScheduleDTO> sessionDtos = new ArrayList<>();
            for (SlotSession ss : e.getValue()) {
                ExaminerScheduleResponseDTO.SessionScheduleDTO sd = new ExaminerScheduleResponseDTO.SessionScheduleDTO();
                sd.setSessionId(ss.getSessionId());
                sd.setStart(ss.getStartAt().toString());
                sd.setEnd(ss.getEndAt().toString());
                ExaminerScheduleResponseDTO.VenueInfo v = new ExaminerScheduleResponseDTO.VenueInfo();
                Venue venue = venueMapper.selectById(ss.getVenueId());
                if (venue != null) {
                    v.setId(venue.getId());
                    v.setVenueName(venue.getRoomName());
                    v.setAssignmentId(venue.getAssignmentId());
                }
                sd.setVenue(v);
                sd.setRequiredExaminers(ss.getRequiredExaminers());
                sd.setCurrentExaminers(sessionExaminerMapper.listExaminerIdsBySession(ss.getSessionId()).size());
                sd.setIsBooked((ss.getEnrolledGroups() != null) && ss.getEnrolledGroups() > 0);
                sd.setBookingCount(ss.getEnrolledGroups());
                sd.setCanWithdraw(false);
                sd.setCannotWithdrawReason(sd.getIsBooked() ? "STUDENT BOOKED" : null);
                sessionDtos.add(sd);
            }
            as.setSessions(sessionDtos);
            assignments.add(as);
        }

        ExaminerScheduleResponseDTO out = new ExaminerScheduleResponseDTO();
        out.setAssignments(assignments);
        return out;
    }

    @Override
    @Transactional
    public ExaminerUnassignResponseDTO unassign(Long assignmentId, Long slotId, Long examinerId) {
        // Validate that the examiner exists and has EXAMINER role
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        TimeSlot ts = timeSlotMapper.selectById(slotId);
        if (ts == null || !Objects.equals(ts.getAssignmentId(), assignmentId)) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }
        // TODO: Deadline and student booking constraints (no related structure yet, skip for now)
        int removed = tseMapper.deleteOne(slotId, examinerId);
        if (removed > 0) {
            int newCurrent = Math.max(0, (ts.getCurrentExaminers() == null ? 0 : ts.getCurrentExaminers()) - 1);
            int booked = ts.getBookedSessions() == null ? 0 : ts.getBookedSessions();
            timeSlotMapper.updateCountersAndStatus(slotId, newCurrent, booked);
        }

        // Calculate updated total assigned sessions
        int updatedAssignedSessions = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, examinerId);

        // Build response DTO
        ExaminerUnassignResponseDTO response = new ExaminerUnassignResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setSlotId(slotId);
        response.setExaminerId(examinerId);
        response.setUpdatedAssignedSessions(updatedAssignedSessions);

        return response;
    }

    /**
     * Validate whether the user is a valid examiner
     */
    private boolean isValidExaminer(Long examinerId) {
        List<SysUser> examiners = sysUserMapper.selectByRoleKey(UserRole.EXAMINER.code());
        return examiners.stream().anyMatch(user -> user.getUserId().equals(examinerId));
    }

    private AssignmentResponseDTO toAssignmentDTO(Assignment a) {
        AssignmentResponseDTO dto = new AssignmentResponseDTO();
        dto.setId(a.getId());
        dto.setSubjectId(a.getSubjectId());
        
        // Fetch and set subject information
        if (a.getSubjectId() != null) {
            try {
                Subject subject = subjectService.getSubjectById(a.getSubjectId());
                if (subject != null) {
                    dto.setSubjectCode(subject.getSubjectCode());
                    dto.setSubjectName(subject.getSubjectName());
                }
            } catch (BusinessException ex) {
                // If subject does not exist or was deleted, set default values
                dto.setSubjectCode("N/A");
                dto.setSubjectName("Course Unavailable");
            }
        }
        
        dto.setName(a.getName());
        dto.setDescription(a.getDescription());
        dto.setType(a.getType());
        dto.setStartDate(a.getStartDate());
        dto.setEndDate(a.getEndDate());
        dto.setWeight(a.getWeight());
        dto.setProgress(a.getProgress());
        dto.setStatus(a.getStatus());
        dto.setRubricMetaInfo(a.getRubricMetaInfo());

        // Populate rubric info
        if (a.getRubricsInfo() != null && !a.getRubricsInfo().trim().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                List<RubricsInfoDto> rubricsInfo = mapper.readValue(a.getRubricsInfo(),
                        mapper.getTypeFactory().constructCollectionType(List.class, RubricsInfoDto.class));
                dto.setRubricsInfo(rubricsInfo);
            } catch (JsonProcessingException e) {
                // If JSON parsing fails, set to null
                dto.setRubricsInfo(null);
            }
        }
        
        dto.setCreator(a.getCreator());
        dto.setUpdater(a.getUpdater());
        dto.setCreateTime(a.getCreateTime());
        dto.setUpdateTime(a.getUpdateTime());
        return dto;
    }

    private SelectableTimeSlotDTO toSelectable(TimeSlot ts) {
        SelectableTimeSlotDTO dto = new SelectableTimeSlotDTO();
        dto.setSlotId(ts.getSlotId());
        dto.setAssignmentId(ts.getAssignmentId());
        dto.setDate(ts.getSlotDate());
        dto.setStartTime(ts.getStartAt().toLocalTime());
        dto.setEndTime(ts.getEndAt().toLocalTime());
        dto.setVenueId(ts.getVenueId());
        dto.setSessionCount(ts.getSessionCount());
        dto.setRequiredExaminers(ts.getRequiredExaminers());
        dto.setCurrentExaminers(ts.getCurrentExaminers());
        dto.setStatus(ts.getStatus());
        return dto;
    }

    private ExaminerScheduleDTO.AssignedSlotDTO toAssigned(TimeSlot ts) {
        ExaminerScheduleDTO.AssignedSlotDTO d = new ExaminerScheduleDTO.AssignedSlotDTO();
        d.setSlotId(ts.getSlotId());
        d.setDate(ts.getSlotDate());
        d.setStartTime(ts.getStartAt().toLocalTime());
        d.setEndTime(ts.getEndAt().toLocalTime());
        d.setVenueId(ts.getVenueId());
        d.setSessionCount(ts.getSessionCount());
        return d;
    }

    private void addFailure(PartialAssignmentResultDTO result, Long slotId, String reason) {
        PartialAssignmentResultDTO.SlotFailure f = new PartialAssignmentResultDTO.SlotFailure();
        f.setSlotId(slotId);
        f.setReason(reason);
        result.getFailures().add(f);
    }

    @Override
    public SessionStudentsResponseDTO getSessionStudents(Long sessionId, Long examinerId) {
        // Validate parameters are not null
        if (sessionId == null || examinerId == null) {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }

        // Validate examiner is valid
        if (!isValidExaminer(examinerId)) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }

        // Fetch session to get assignmentId
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        }

        // 1) Get all booking records for this session
        List<SessionStudent> sessionStudents = sessionStudentMapper.listBySession(sessionId);
        
        SessionStudentsResponseDTO response = new SessionStudentsResponseDTO();
        response.setSessionId(sessionId);
        response.setTotalCount(sessionStudents.size());
        
        List<SessionStudentsResponseDTO.StudentInfoDTO> students = new ArrayList<>();
        List<SessionStudentsResponseDTO.GroupInfoDTO> groups = new ArrayList<>();
        
        for (SessionStudent sessionStudent : sessionStudents) {
            if ("INDIVIDUAL".equals(sessionStudent.getType())) {
                // Handle individual student type
                SessionStudentsResponseDTO.StudentInfoDTO studentInfo = buildStudentInfo(sessionStudent, session.getAssignmentId(), examinerId);
                if (studentInfo != null && shouldIncludeInResponse(studentInfo.getAssessmentStatus())) {
                    students.add(studentInfo);
                }
            } else if ("GROUP".equals(sessionStudent.getType()) || "MIX".equals(sessionStudent.getType())) {
                // Handle group and mix types (MIX is treated as group in display, but creates both individual and group assessments)
                SessionStudentsResponseDTO.GroupInfoDTO groupInfo = buildGroupInfo(sessionStudent, session.getAssignmentId(), examinerId);
                if (groupInfo != null && shouldIncludeInResponse(groupInfo.getAssessmentStatus())) {
                    groups.add(groupInfo);
                }
            }
        }
        
        response.setStudents(students);
        response.setGroups(groups);
        
        // Update total count to actual returned quantity (after filtering)
        response.setTotalCount(students.size() + groups.size());
        
        return response;
    }

    /**
     * Build student information DTO
     */
    private SessionStudentsResponseDTO.StudentInfoDTO buildStudentInfo(SessionStudent sessionStudent, Long assignmentId, Long examinerId) {
        try {
            // Get user basic information from sys_user table
            SysUser user = sysUserMapper.selectById(sessionStudent.getSubjectId());
            if (user == null) {
                return null;
            }

            // Get student specific information from sys_student table
            SysStudent student = sysStudentMapper.selectById(sessionStudent.getSubjectId());
            
            SessionStudentsResponseDTO.StudentInfoDTO studentInfo = new SessionStudentsResponseDTO.StudentInfoDTO();
            studentInfo.setUserId(user.getUserId());
            studentInfo.setStudentName(user.getUserName());
            studentInfo.setEmail(user.getEmail());
            studentInfo.setStudentNumber(student != null ? student.getStudentNumber() : null);
            studentInfo.setBookedTime(sessionStudent.getBookedTime());
            studentInfo.setType(sessionStudent.getType());
            
            // Build assessment status information
            SessionStudentsResponseDTO.AssessmentStatusDTO assessmentStatus = buildAssessmentStatus(
                sessionStudent.getId(), examinerId);
            studentInfo.setAssessmentStatus(assessmentStatus);
            
            return studentInfo;
        } catch (Exception e) {
            // Log error but don't interrupt the entire process
            return null;
        }
    }

    /**
     * Build group information DTO
     */
    private SessionStudentsResponseDTO.GroupInfoDTO buildGroupInfo(SessionStudent sessionStudent, Long assignmentId, Long examinerId) {
        try {
            // Get group basic information
            SysGroup group = groupMapper.selectById(sessionStudent.getSubjectId());
            if (group == null) {
                return null;
            }

            SessionStudentsResponseDTO.GroupInfoDTO groupInfo = new SessionStudentsResponseDTO.GroupInfoDTO();
            groupInfo.setGroupId(group.getGroupId());
            groupInfo.setGroupName(group.getGroupName());
            groupInfo.setCanvasGroupId(group.getCanvasGroupId());
            groupInfo.setBookedTime(sessionStudent.getBookedTime());
            groupInfo.setType(sessionStudent.getType());
            
            // Get group members information
            List<SessionStudentsResponseDTO.GroupMemberDTO> members = buildGroupMembers(group.getGroupId());
            groupInfo.setMembers(members);
            
            // Build assessment status information (group-level)
            SessionStudentsResponseDTO.AssessmentStatusDTO assessmentStatus = buildAssessmentStatus(
                sessionStudent.getId(), examinerId);
            groupInfo.setAssessmentStatus(assessmentStatus);
            
            // For MIX type, also build individual member assessments
            if ("MIX".equals(sessionStudent.getType())) {
                List<SessionStudentsResponseDTO.MemberAssessmentDTO> memberAssessments = 
                    buildMixTypeMemberAssessments(group.getGroupId(), sessionStudent.getSessionId(), 
                                                 assignmentId, examinerId);
                groupInfo.setMemberAssessments(memberAssessments);
            }
            
            return groupInfo;
        } catch (Exception e) {
            // Log error but don't interrupt the entire process
            return null;
        }
    }

    /**
     * Build group members information list
     */
    private List<SessionStudentsResponseDTO.GroupMemberDTO> buildGroupMembers(Long groupId) {
        List<SessionStudentsResponseDTO.GroupMemberDTO> members = new ArrayList<>();
        
        try {
            // Get group member relationships
            QueryWrapper<SysStudentGroup> wrapper = new QueryWrapper<>();
            wrapper.eq("group_id", groupId);
            List<SysStudentGroup> studentGroups = sysStudentGroupMapper.selectList(wrapper);
            
            for (SysStudentGroup studentGroup : studentGroups) {
                // Get user basic information
                SysUser user = sysUserMapper.selectById(studentGroup.getUserId());
                if (user == null) continue;
                
                // Get student specific information
                SysStudent student = sysStudentMapper.selectById(studentGroup.getUserId());
                
                SessionStudentsResponseDTO.GroupMemberDTO member = new SessionStudentsResponseDTO.GroupMemberDTO();
                member.setUserId(user.getUserId());
                member.setStudentName(user.getUserName());
                member.setEmail(user.getEmail());
                member.setStudentNumber(student != null ? student.getStudentNumber() : null);
                
                members.add(member);
            }
        } catch (Exception e) {
            // Log error but return empty list
        }
        
        return members;
    }

    /**
     * Check if the assessment status should be included in response (only NO_MARK, DRAFT, REOPEN statuses)
     */
    private boolean shouldIncludeInResponse(SessionStudentsResponseDTO.AssessmentStatusDTO assessmentStatus) {
        if (assessmentStatus == null) return false;
        
        AssessmentStatus status = assessmentStatus.getStatus();
        return status == AssessmentStatus.NO_MARK || 
               status == AssessmentStatus.DRAFT || 
               status == AssessmentStatus.REOPEN;
    }
    
    /**
     * Build individual member assessments for MIX type
     * Returns assessment status for each member's individual score
     */
    private List<SessionStudentsResponseDTO.MemberAssessmentDTO> buildMixTypeMemberAssessments(
            Long groupId, Long sessionId, Long assignmentId, Long examinerId) {
        List<SessionStudentsResponseDTO.MemberAssessmentDTO> memberAssessments = new ArrayList<>();
        
        try {
            // Get all group members
            QueryWrapper<SysStudentGroup> wrapper = new QueryWrapper<>();
            wrapper.eq("group_id", groupId);
            List<SysStudentGroup> studentGroups = sysStudentGroupMapper.selectList(wrapper);
            
            for (SysStudentGroup studentGroup : studentGroups) {
                Long studentId = studentGroup.getUserId();
                
                // Get user and student information
                SysUser user = sysUserMapper.selectById(studentId);
                if (user == null) continue;
                
                SysStudent student = sysStudentMapper.selectById(studentId);
                
                // Query individual assessment submission for this student
                AssessmentSubmission individualSubmission = assessmentSubmissionMapper.selectByUniqueTarget(
                    assignmentId, sessionId, "INDIVIDUAL", studentId, examinerId);
                
                // Build member assessment DTO
                SessionStudentsResponseDTO.MemberAssessmentDTO memberAssessment = 
                    new SessionStudentsResponseDTO.MemberAssessmentDTO();
                memberAssessment.setUserId(studentId);
                memberAssessment.setStudentName(user.getUserName());
                memberAssessment.setStudentNumber(student != null ? student.getStudentNumber() : null);
                
                // Build assessment status for this member
                SessionStudentsResponseDTO.AssessmentStatusDTO memberStatus = 
                    new SessionStudentsResponseDTO.AssessmentStatusDTO();
                
                if (individualSubmission != null) {
                    String dbStatus = individualSubmission.getStatus();
                    memberStatus.setSubmissionId(individualSubmission.getId());
                    memberStatus.setUpdatedAt(individualSubmission.getUpdatedAt());
                    
                    if ("DRAFT".equals(dbStatus)) {
                        memberStatus.setStatus(AssessmentStatus.DRAFT);
                        memberStatus.setTotalScore(individualSubmission.getTotalScore());
                        memberStatus.setOverallFeedback(individualSubmission.getOverallFeedback());
                        memberStatus.setAdminNote(individualSubmission.getAdminNote());
                        memberStatus.setSubmittedAt(individualSubmission.getSubmittedAt());
                        memberStatus.setScoresJson(individualSubmission.getScoresJson());
                    } else if ("REOPENED".equals(dbStatus)) {
                        memberStatus.setStatus(AssessmentStatus.REOPEN);
                        memberStatus.setTotalScore(individualSubmission.getTotalScore());
                        memberStatus.setOverallFeedback(individualSubmission.getOverallFeedback());
                        memberStatus.setAdminNote(individualSubmission.getAdminNote());
                        memberStatus.setSubmittedAt(individualSubmission.getSubmittedAt());
                        memberStatus.setScoresJson(individualSubmission.getScoresJson());
                    } else if ("SUBMITTED".equals(dbStatus)) {
                        // For SUBMITTED status, still include in MIX type to show completion
                        memberStatus.setStatus(AssessmentStatus.DRAFT); // Show as DRAFT in response
                        memberStatus.setTotalScore(individualSubmission.getTotalScore());
                        memberStatus.setSubmittedAt(individualSubmission.getSubmittedAt());
                    }
                } else {
                    // No assessment record, mark as NO_MARK
                    memberStatus.setStatus(AssessmentStatus.NO_MARK);
                }
                
                memberAssessment.setAssessmentStatus(memberStatus);
                memberAssessments.add(memberAssessment);
            }
        } catch (Exception e) {
            // Return empty list on error
        }
        
        return memberAssessments;
    }

    /**
     * Build assessment status information using enrollment ID
     */
    private SessionStudentsResponseDTO.AssessmentStatusDTO buildAssessmentStatus(
            Long enrollmentId, Long examinerId) {
        
        SessionStudentsResponseDTO.AssessmentStatusDTO status = new SessionStudentsResponseDTO.AssessmentStatusDTO();
        
        try {
            // Query if there exists assessment record for this examiner and enrollment
            AssessmentSubmission submission = assessmentSubmissionMapper.selectByEnrollmentAndExaminer(
                enrollmentId, examinerId);
            
            if (submission != null) {
                // Assessment record exists, set enum status based on database status
                status.setSubmissionId(submission.getId());
                status.setUpdatedAt(submission.getUpdatedAt());
                
                String dbStatus = submission.getStatus();
                if ("DRAFT".equals(dbStatus)) {
                    status.setStatus(AssessmentStatus.DRAFT);
                    // Fill detailed information for DRAFT status
                    status.setTotalScore(submission.getTotalScore());
                    status.setOverallFeedback(submission.getOverallFeedback());
                    status.setAdminNote(submission.getAdminNote());
                    status.setSubmittedAt(submission.getSubmittedAt());
                    status.setScoresJson(submission.getScoresJson());
                } else if ("REOPENED".equals(dbStatus)) {
                    status.setStatus(AssessmentStatus.REOPEN);
                    // Fill detailed information for REOPEN status
                    status.setTotalScore(submission.getTotalScore());
                    status.setOverallFeedback(submission.getOverallFeedback());
                    status.setAdminNote(submission.getAdminNote());
                    status.setSubmittedAt(submission.getSubmittedAt());
                    status.setScoresJson(submission.getScoresJson());
                } else if ("SUBMITTED".equals(dbStatus)) {
                    // SUBMITTED status is not returned in this interface, return null to exclude from results
                    return null;
                } else {
                    // Unknown status, exclude from results
                    return null;
                }
            } else {
                // No assessment record exists, indicates NO_MARK status
                status.setSubmissionId(null);
                status.setStatus(AssessmentStatus.NO_MARK);
                status.setTotalScore(null);
                status.setOverallFeedback(null);
                status.setAdminNote(null);
                status.setSubmittedAt(null);
                status.setUpdatedAt(null);
                status.setScoresJson(null);
            }
        } catch (Exception e) {
            // Return null when error occurs, exclude from results
            return null;
        }
        
        return status;
    }

    @Override
    public SessionStudentsSimpleResponseDTO getSessionStudentsSimple(Long sessionId) {
        // Validate sessionId is not null
        if (sessionId == null) {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }

        // Get all enrollment records for this session
        List<SessionStudent> sessionStudents = sessionStudentMapper.listBySession(sessionId);
        
        SessionStudentsSimpleResponseDTO response = new SessionStudentsSimpleResponseDTO();
        response.setSessionId(sessionId);
        response.setTotalCount(sessionStudents.size());
        
        List<SessionStudentsSimpleResponseDTO.StudentInfoDTO> students = new ArrayList<>();
        List<SessionStudentsSimpleResponseDTO.GroupInfoDTO> groups = new ArrayList<>();
        
        for (SessionStudent sessionStudent : sessionStudents) {
            if ("INDIVIDUAL".equals(sessionStudent.getType())) {
                // Handle individual student type
                SessionStudentsSimpleResponseDTO.StudentInfoDTO studentInfo = buildSimpleStudentInfo(sessionStudent);
                if (studentInfo != null) {
                    students.add(studentInfo);
                }
            } else if ("GROUP".equals(sessionStudent.getType()) || "MIX".equals(sessionStudent.getType())) {
                // Handle group and mix types
                SessionStudentsSimpleResponseDTO.GroupInfoDTO groupInfo = buildSimpleGroupInfo(sessionStudent);
                if (groupInfo != null) {
                    groups.add(groupInfo);
                }
            }
        }
        
        response.setStudents(students);
        response.setGroups(groups);
        
        return response;
    }

    /**
     * Build simple student information DTO without assessment status
     */
    private SessionStudentsSimpleResponseDTO.StudentInfoDTO buildSimpleStudentInfo(SessionStudent sessionStudent) {
        try {
            // Get user basic information from sys_user table
            SysUser user = sysUserMapper.selectById(sessionStudent.getSubjectId());
            if (user == null) {
                return null;
            }

            // Get student specific information from sys_student table
            SysStudent student = sysStudentMapper.selectById(sessionStudent.getSubjectId());
            
            SessionStudentsSimpleResponseDTO.StudentInfoDTO studentInfo = new SessionStudentsSimpleResponseDTO.StudentInfoDTO();
            studentInfo.setUserId(user.getUserId());
            studentInfo.setStudentName(user.getUserName());
            studentInfo.setEmail(user.getEmail());
            studentInfo.setStudentNumber(student != null ? student.getStudentNumber() : null);
            studentInfo.setBookedTime(sessionStudent.getBookedTime());
            studentInfo.setType(sessionStudent.getType());
            
            return studentInfo;
        } catch (Exception e) {
            // Log error but don't interrupt the entire process
            return null;
        }
    }

    /**
     * Build simple group information DTO without assessment status
     */
    private SessionStudentsSimpleResponseDTO.GroupInfoDTO buildSimpleGroupInfo(SessionStudent sessionStudent) {
        try {
            // Get group basic information
            SysGroup group = groupMapper.selectById(sessionStudent.getSubjectId());
            if (group == null) {
                return null;
            }

            SessionStudentsSimpleResponseDTO.GroupInfoDTO groupInfo = new SessionStudentsSimpleResponseDTO.GroupInfoDTO();
            groupInfo.setGroupId(group.getGroupId());
            groupInfo.setGroupName(group.getGroupName());
            groupInfo.setCanvasGroupId(group.getCanvasGroupId());
            groupInfo.setBookedTime(sessionStudent.getBookedTime());
            groupInfo.setType(sessionStudent.getType());
            
            // Get group members information (reuse existing method)
            List<SessionStudentsResponseDTO.GroupMemberDTO> existingMembers = buildGroupMembers(group.getGroupId());
            List<SessionStudentsSimpleResponseDTO.GroupMemberDTO> simpleMembers = new ArrayList<>();
            
            for (SessionStudentsResponseDTO.GroupMemberDTO existingMember : existingMembers) {
                SessionStudentsSimpleResponseDTO.GroupMemberDTO simpleMember = new SessionStudentsSimpleResponseDTO.GroupMemberDTO();
                simpleMember.setUserId(existingMember.getUserId());
                simpleMember.setStudentName(existingMember.getStudentName());
                simpleMember.setEmail(existingMember.getEmail());
                simpleMember.setStudentNumber(existingMember.getStudentNumber());
                simpleMembers.add(simpleMember);
            }
            
            groupInfo.setMembers(simpleMembers);
            
            return groupInfo;
        } catch (Exception e) {
            // Log error but don't interrupt the entire process
            return null;
        }
    }
}


