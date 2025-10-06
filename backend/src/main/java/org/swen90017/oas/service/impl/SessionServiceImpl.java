package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.AssignMode;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.mapper.SessionStudentMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.GroupMapper;
import org.swen90017.oas.mapper.SysStudentGroupMapper;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.ExaminerAssignmentLimitMapper;
import org.swen90017.oas.mapper.AssignmentSessionConfigMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.mapper.AssessmentSubmissionMapper;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.service.SessionService;
import org.swen90017.oas.dto.response.AdminSessionsListResponseDTO;
import org.swen90017.oas.dto.response.SessionDetailDTO;
import org.swen90017.oas.dto.request.SessionRequestDTO;
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.enums.UserRole;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionServiceImpl implements SessionService {

    private final SessionExaminerMapper sessionExaminerMapper;
    private final SessionStudentMapper sessionStudentMapper;
    private final SysStudentMapper sysStudentMapper;
    private final GroupMapper groupMapper;
    private final SysStudentGroupMapper sysStudentGroupMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final VenueMapper venueMapper;
    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;
    private final ExaminerAssignmentLimitMapper limitMapper;
    private final AssignmentSessionConfigMapper sessionConfigMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final SubjectMapper subjectMapper;
    private final EmailService emailService;
    private final AssessmentSubmissionMapper assessmentSubmissionMapper;

    @Override
    public List<Long> listExaminerIds(Long sessionId) {
        return sessionExaminerMapper.listExaminerIdsBySession(sessionId);
    }

    @Override
    public List<Long> findConflictsForExaminer(Long examinerId, LocalDateTime startAt, LocalDateTime endAt) {
        return sessionExaminerMapper.findConflictedSessionsForExaminer(examinerId, startAt, endAt);
    }

    @Override
    @Transactional
    public boolean assignExaminer(Long sessionId, Long examinerId, Long operatorId) {
        SlotSession session = slotSessionMapper.selectById(sessionId);
        if (session == null) {
            throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        }

        // Role validation: must be an examiner
        boolean isExaminer = sysUserMapper.existsUserWithRoles(examinerId, java.util.Collections.singletonList(UserRole.EXAMINER.code()));
        if (!isExaminer) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }

        // Conflict validation
        List<Long> conflicts = sessionExaminerMapper.findConflictedSessionsForExaminer(
                examinerId, session.getStartAt(), session.getEndAt());
        if (conflicts != null && !conflicts.isEmpty()) {
            throw new BusinessException("Examiner has time conflict");
        }

        // Duplicate validation
        List<Long> existing = sessionExaminerMapper.listExaminerIdsBySession(sessionId);
        if (existing != null && new HashSet<>(existing).contains(examinerId)) {
            return false;
        }

        // Capacity validation: assigned count must not exceed requiredExaminers
        Integer required = session.getRequiredExaminers();
        int currentAssigned = existing == null ? 0 : existing.size();
        if (required != null && required > 0 && currentAssigned >= required) {
            throw new BusinessException(BusinessError.EXCEEDS_REQUIRED_EXAMINERS);
        }

        SessionExaminer link = new SessionExaminer();
        link.setSessionId(sessionId);
        link.setExaminerId(examinerId);
        link.setAssignedAt(LocalDateTime.now());
        link.setAssignedBy(operatorId);
        int rows = sessionExaminerMapper.insert(link);
        return rows > 0;
    }

    @Override
    @Transactional
    public boolean unassignExaminer(Long sessionId, Long examinerId) {
        // Check if the examiner has any assessment records in this session (draft, submitted, released, or reopen)
        Long assessmentCount = assessmentSubmissionMapper.countSubmittedAssessmentsBySessionAndExaminer(sessionId, examinerId);
        if (assessmentCount != null && assessmentCount > 0) {
            throw new BusinessException("Cannot unassign examiner: this examiner has assessment records in this session");
        }
        
        int rows = sessionExaminerMapper.deleteOne(sessionId, examinerId);
        return rows > 0;
    }

    @Override
    @Transactional
    public int batchCreateSessions(Long assignmentId, List<org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO.SessionWindowDTO> windows) {
        if (windows == null || windows.isEmpty()) {
            return 0;
        }
        
        // Validate assignment exists and get assignment time range
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        // 1) Build candidate windows
        List<SlotSession> toInsert = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (BatchCreateSessionsRequestDTO.SessionWindowDTO w : windows) {
            LocalDateTime startAt = w.getDate().atTime(w.getStartTime());
            LocalDateTime endAt = w.getDate().atTime(w.getEndTime());
            if (!endAt.isAfter(startAt)) {
                throw new BusinessException(BusinessError.INVALID_PARAM);
            }
            
            // Validate session time is within assignment time range
            if (assignment.getStartDate() != null && startAt.isBefore(assignment.getStartDate())) {
                throw new BusinessException("Session start time is before assignment start date", "SESSION_BEFORE_ASSIGNMENT_START");
            }
            if (assignment.getEndDate() != null && endAt.isAfter(assignment.getEndDate())) {
                throw new BusinessException("Session end time is after assignment end date", "SESSION_AFTER_ASSIGNMENT_END");
            }

            // Validate venue: must exist and belong to the assignment
            if (w.getVenueId() != null) {
                Venue v = venueMapper.selectById(w.getVenueId());
                if (v == null) {
                    throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
                }
                if (v.getAssignmentId() == null || !assignmentId.equals(v.getAssignmentId())) {
                    throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
                }
            }

            // Simplification: evenly split by sessionCount; if missing, treat the whole window as a single session
            int count = (w.getSessionCount() == null || w.getSessionCount() <= 0) ? 1 : w.getSessionCount();
            long totalMinutes = Duration.between(startAt, endAt).toMinutes();
            long per = Math.max(1, totalMinutes / count);
            LocalDateTime cursor = startAt;
            for (int i = 1; i <= count; i++) {
                SlotSession s = new SlotSession();
                s.setAssignmentId(assignmentId);
                s.setSlotId(null); // No longer depends on timeslot
                s.setSessionNumber(i);
                s.setStartAt(cursor);
                LocalDateTime segEnd = (i == count) ? endAt : cursor.plusMinutes(per);
                s.setEndAt(segEnd);
                s.setStatus(SessionStatus.AVAILABLE);
                s.setVenueId(w.getVenueId());
                s.setCapacityGroups(w.getCapacity() == null ? 1 : w.getCapacity());
                s.setEnrolledGroups(0);
                s.setAssignMode(AssignMode.INDIVIDUAL);
                s.setRequiredExaminers(w.getRequiredExaminers() == null ? 1 : w.getRequiredExaminers());
                s.setIsPublishedToExaminer(false);
                s.setIsPublishedToStudent(false);
                s.setIsStaffed(false);
                s.setCreatedAt(now);
                s.setUpdatedAt(now);
                toInsert.add(s);
                cursor = segEnd;
            }
        }
        // 2) Batch pre-check: overlap with DB
        for (SlotSession s : toInsert) {
            if (s.getVenueId() == null) continue;
            int overlap = slotSessionMapper.countVenueOverlap(assignmentId, s.getVenueId(), s.getStartAt(), s.getStartAt(), s.getEndAt(), null);
            if (overlap > 0) {
                throw new BusinessException(BusinessError.SESSION_CONFLICT);
            }
        }
        // 3) Batch pre-check: within-batch overlap (same venue and same day)
        toInsert.sort(java.util.Comparator.comparing(SlotSession::getVenueId, java.util.Comparator.nullsLast(Long::compareTo))
                .thenComparing(SlotSession::getStartAt));
        for (int i = 1; i < toInsert.size(); i++) {
            SlotSession prev = toInsert.get(i - 1);
            SlotSession curr = toInsert.get(i);
            if (prev.getVenueId() != null && curr.getVenueId() != null && prev.getVenueId().equals(curr.getVenueId())) {
                if (!(prev.getEndAt().isEqual(curr.getStartAt()) || prev.getEndAt().isBefore(curr.getStartAt()))) {
                    throw new BusinessException(BusinessError.SESSION_CONFLICT);
                }
            }
        }
        if (!toInsert.isEmpty()) {
            slotSessionMapper.batchInsert(toInsert);
        }
        return toInsert.size();
    }

    @Override
    public AdminSessionsListResponseDTO listAdminSessions(Long assignmentId, String date, String status, Long venueId) {
        // Validate assignment exists and get assignment time range
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        // Check if the requested date is within assignment time range
        LocalDate target = (date == null || date.isEmpty()) ? null : LocalDate.parse(date);
        if (target != null) {
            // Check if target date is within assignment date range
            LocalDate assignmentStartDate = assignment.getStartDate() != null ? assignment.getStartDate().toLocalDate() : null;
            LocalDate assignmentEndDate = assignment.getEndDate() != null ? assignment.getEndDate().toLocalDate() : null;
            
            if (assignmentStartDate != null && target.isBefore(assignmentStartDate)) {
                // Return empty response with indication that date is outside assignment range
                AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
                resp.setSessions(new ArrayList<>());
                resp.setFullyStaffed(0);
                resp.setPartiallyStaffed(0);
                resp.setUnstaffed(0);
                resp.setOutsideAssignmentRange(true);
                resp.setMessage("Requested date is before assignment start date");
                return resp;
            }
            
            if (assignmentEndDate != null && target.isAfter(assignmentEndDate)) {
                // Return empty response with indication that date is outside assignment range
                AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
                resp.setSessions(new ArrayList<>());
                resp.setFullyStaffed(0);
                resp.setPartiallyStaffed(0);
                resp.setUnstaffed(0);
                resp.setOutsideAssignmentRange(true);
                resp.setMessage("Requested date is after assignment end date");
                return resp;
            }
        }
        
        // Simplification: query by date range and filter status/venue in memory
        LocalDateTime from = target == null ? null : target.atStartOfDay();
        LocalDateTime to = target == null ? null : target.atTime(23,59,59);
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(assignmentId, from, to);
        AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
        List<AdminSessionsListResponseDTO.Item> items = new ArrayList<>();
        int fully = 0, partial = 0, un = 0,totalExaminers=0;
        for (SlotSession s : sessions) {
            if (venueId != null && (s.getVenueId() == null || !venueId.equals(s.getVenueId()))) continue;
            if (status != null && !status.isEmpty() && !s.getStatus().name().equalsIgnoreCase(status)) continue;
            AdminSessionsListResponseDTO.Item it = new AdminSessionsListResponseDTO.Item();
            it.setId(s.getSessionId());
            it.setDate(s.getStartAt().toLocalDate());
            it.setStartTime(s.getStartAt().toLocalTime());
            it.setEndTime(s.getEndAt().toLocalTime());
            it.setVenueId(s.getVenueId());
            if (s.getVenueId() != null) {
                Venue v = venueMapper.selectById(s.getVenueId());
                it.setVenueName(v == null ? null : v.getRoomName());
            } else {
                it.setVenueName(null);
            }
            it.setRequiredExaminers(s.getRequiredExaminers());
            it.setCapacity(s.getCapacityGroups());
            List<Long> examinerIds = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            List<AdminSessionsListResponseDTO.ExaminerDTO> assigned = new ArrayList<>();
            if (examinerIds != null) {
                for (Long id : examinerIds) {
                    AdminSessionsListResponseDTO.ExaminerDTO e = new AdminSessionsListResponseDTO.ExaminerDTO();
                    e.setId(id);
                    SysUser u = sysUserMapper.selectById(id);
                    e.setName(u == null ? null : u.getUserName());
                    assigned.add(e);
                }
            }
            it.setAssignedExaminers(assigned);
            
            // Fetch enrolled students and groups
            List<SessionStudent> enrollments = sessionStudentMapper.listBySession(s.getSessionId());
            List<AdminSessionsListResponseDTO.EnrolledStudentDTO> enrolledStudents = new ArrayList<>();
            List<AdminSessionsListResponseDTO.EnrolledGroupDTO> enrolledGroups = new ArrayList<>();
            
            for (SessionStudent enrollment : enrollments) {
                if ("INDIVIDUAL".equals(enrollment.getType())) {
                    SysStudent student = sysStudentMapper.selectById(enrollment.getSubjectId());
                    if (student != null) {
                        SysUser user = sysUserMapper.selectById(student.getUserId());
                        AdminSessionsListResponseDTO.EnrolledStudentDTO studentDTO = new AdminSessionsListResponseDTO.EnrolledStudentDTO();
                        studentDTO.setId(student.getUserId());
                        studentDTO.setName(user == null ? null : user.getUserName());
                        studentDTO.setStudentNumber(student.getStudentNumber());
                        enrolledStudents.add(studentDTO);
                    }
                } else if ("GROUP".equals(enrollment.getType())) {
                    SysGroup group = groupMapper.selectById(enrollment.getSubjectId());
                    if (group != null) {
                        AdminSessionsListResponseDTO.EnrolledGroupDTO groupDTO = new AdminSessionsListResponseDTO.EnrolledGroupDTO();
                        groupDTO.setId(group.getGroupId());
                        groupDTO.setName(group.getGroupName());
                        // Get group member count
                        Long memberCountLong = sysStudentGroupMapper.selectCount(
                            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysStudentGroup>()
                                .eq("group_id", group.getGroupId())
                        );
                        int memberCount = memberCountLong.intValue();
                        groupDTO.setMemberCount(memberCount);
                        enrolledGroups.add(groupDTO);
                    }
                }
            }
            
            it.setEnrolledStudents(enrolledStudents);
            it.setEnrolledGroups(enrolledGroups);
            
            int booked = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            it.setBookedCount(booked);
            int cap = s.getCapacityGroups() == null ? 1 : s.getCapacityGroups();
            it.setRemainingCapacity(Math.max(0, cap - booked));
            it.setStatus(s.getStatus().name().toLowerCase());
            it.setCreatedAt(s.getCreatedAt());
            it.setLastModified(s.getUpdatedAt());
            // Derive publish flags based on assignment.status
            Assignment a = assignmentMapper.selectById(s.getAssignmentId());
            String st = a == null ? null : a.getStatus();
            boolean toExaminer = "IN_PROGRESS".equalsIgnoreCase(st) || "RELEASED".equalsIgnoreCase(st);
            boolean toStudent = "RELEASED".equalsIgnoreCase(st);
            it.setPublishedToExaminer(toExaminer);
            it.setPublishedToStudent(toStudent);
            items.add(it);
            int req = s.getRequiredExaminers() == null ? 0 : s.getRequiredExaminers();
            totalExaminers+=req;
            int cur = examinerIds == null ? 0 : examinerIds.size();
            if (cur == 0) un++; else if (cur >= req && req > 0) fully++; else partial++;
        }
        resp.setSessions(items);
        AdminSessionsListResponseDTO.Summary sum = new AdminSessionsListResponseDTO.Summary();
        sum.setTotalSessions(items.size());
        sum.setFullyStaffed(fully);
        sum.setPartiallyStaffed(partial);
        sum.setUnstaffed(un);
        sum.setTotalRequiredExaminers(totalExaminers);
        resp.setSummary(sum);
        return resp;
    }

    @Override
    public AdminSessionsListResponseDTO listExaminerSessions(Long examinerId, Long assignmentId, String date, String status, Long venueId) {
        // Validate that the examiner exists and has EXAMINER role
        boolean isExaminer = sysUserMapper.existsUserWithRoles(examinerId, Collections.singletonList(UserRole.EXAMINER.code()));
        if (!isExaminer) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
        }
        
        // Validate assignment exists and get its time range
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        // Check whether the requested date falls within the assignment time range
        LocalDate target = (date == null || date.isEmpty()) ? null : LocalDate.parse(date);
        if (target != null) {
            LocalDate assignmentStartDate = assignment.getStartDate() != null ? assignment.getStartDate().toLocalDate() : null;
            LocalDate assignmentEndDate = assignment.getEndDate() != null ? assignment.getEndDate().toLocalDate() : null;
            
            if (assignmentStartDate != null && target.isBefore(assignmentStartDate)) {
                AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
                resp.setSessions(new ArrayList<>());
                resp.setOutsideAssignmentRange(true);
                resp.setMessage("Requested date is before assignment start date");
                AdminSessionsListResponseDTO.Summary sum = new AdminSessionsListResponseDTO.Summary();
                sum.setTotalSessions(0);
                sum.setFullyStaffed(0);
                sum.setPartiallyStaffed(0);
                sum.setUnstaffed(0);
                resp.setSummary(sum);
                return resp;
            }
            
            if (assignmentEndDate != null && target.isAfter(assignmentEndDate)) {
                AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
                resp.setSessions(new ArrayList<>());
                resp.setOutsideAssignmentRange(true);
                resp.setMessage("Requested date is after assignment end date");
                AdminSessionsListResponseDTO.Summary sum = new AdminSessionsListResponseDTO.Summary();
                sum.setTotalSessions(0);
                sum.setFullyStaffed(0);
                sum.setPartiallyStaffed(0);
                sum.setUnstaffed(0);
                resp.setSummary(sum);
                return resp;
            }
        }
        
        // Fetch sessions the examiner participates in
        List<SlotSession> examinerSessions = sessionExaminerMapper.listSessionsByExaminer(examinerId, assignmentId);
        
        AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
        List<AdminSessionsListResponseDTO.Item> items = new ArrayList<>();
        int fully = 0, partial = 0, un = 0;
        
        for (SlotSession s : examinerSessions) {
            // Apply filters
            if (target != null && !s.getStartAt().toLocalDate().equals(target)) continue;
            if (venueId != null && (s.getVenueId() == null || !venueId.equals(s.getVenueId()))) continue;
            if (status != null && !status.isEmpty() && !s.getStatus().name().equalsIgnoreCase(status)) continue;
            
            AdminSessionsListResponseDTO.Item it = new AdminSessionsListResponseDTO.Item();
            it.setId(s.getSessionId());
            it.setDate(s.getStartAt().toLocalDate());
            it.setStartTime(s.getStartAt().toLocalTime());
            it.setEndTime(s.getEndAt().toLocalTime());
            it.setVenueId(s.getVenueId());
            
            if (s.getVenueId() != null) {
                Venue v = venueMapper.selectById(s.getVenueId());
                it.setVenueName(v == null ? null : v.getRoomName());
            } else {
                it.setVenueName(null);
            }
            
            it.setRequiredExaminers(s.getRequiredExaminers());
            it.setCapacity(s.getCapacityGroups());
            
            List<Long> examinerIds = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            List<AdminSessionsListResponseDTO.ExaminerDTO> assigned = new ArrayList<>();
            if (examinerIds != null) {
                for (Long id : examinerIds) {
                    AdminSessionsListResponseDTO.ExaminerDTO e = new AdminSessionsListResponseDTO.ExaminerDTO();
                    e.setId(id);
                    SysUser u = sysUserMapper.selectById(id);
                    e.setName(u == null ? null : u.getUserName());
                    assigned.add(e);
                }
            }
            it.setAssignedExaminers(assigned);
            
            // Fetch enrolled students and groups
            List<SessionStudent> enrollments = sessionStudentMapper.listBySession(s.getSessionId());
            List<AdminSessionsListResponseDTO.EnrolledStudentDTO> enrolledStudents = new ArrayList<>();
            List<AdminSessionsListResponseDTO.EnrolledGroupDTO> enrolledGroups = new ArrayList<>();
            
            for (SessionStudent enrollment : enrollments) {
                if ("INDIVIDUAL".equals(enrollment.getType())) {
                    SysStudent student = sysStudentMapper.selectById(enrollment.getSubjectId());
                    if (student != null) {
                        SysUser user = sysUserMapper.selectById(student.getUserId());
                        AdminSessionsListResponseDTO.EnrolledStudentDTO studentDTO = new AdminSessionsListResponseDTO.EnrolledStudentDTO();
                        studentDTO.setId(student.getUserId());
                        studentDTO.setName(user == null ? null : user.getUserName());
                        studentDTO.setStudentNumber(student.getStudentNumber());
                        enrolledStudents.add(studentDTO);
                    }
                } else if ("GROUP".equals(enrollment.getType())) {
                    SysGroup group = groupMapper.selectById(enrollment.getSubjectId());
                    if (group != null) {
                        AdminSessionsListResponseDTO.EnrolledGroupDTO groupDTO = new AdminSessionsListResponseDTO.EnrolledGroupDTO();
                        groupDTO.setId(group.getGroupId());
                        groupDTO.setName(group.getGroupName());
                        // Get group member count
                        Long memberCountLong = sysStudentGroupMapper.selectCount(
                            new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<SysStudentGroup>()
                                .eq("group_id", group.getGroupId())
                        );
                        int memberCount = memberCountLong.intValue();
                        groupDTO.setMemberCount(memberCount);
                        enrolledGroups.add(groupDTO);
                    }
                }
            }
            
            it.setEnrolledStudents(enrolledStudents);
            it.setEnrolledGroups(enrolledGroups);
            
            int booked = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            it.setBookedCount(booked);
            int cap = s.getCapacityGroups() == null ? 0 : s.getCapacityGroups();
            it.setRemainingCapacity(Math.max(0, cap - booked));
            it.setStatus(s.getStatus().name().toLowerCase());
            it.setCreatedAt(s.getCreatedAt());
            it.setLastModified(s.getUpdatedAt());
            
            // Derive publish flags based on assignment.status
            String st = assignment.getStatus();
            boolean toExaminer = "IN_PROGRESS".equalsIgnoreCase(st) || "RELEASED".equalsIgnoreCase(st);
            boolean toStudent = "RELEASED".equalsIgnoreCase(st);
            it.setPublishedToExaminer(toExaminer);
            it.setPublishedToStudent(toStudent);
            
            items.add(it);
            
            // Compute statistics
            int req = s.getRequiredExaminers() == null ? 0 : s.getRequiredExaminers();
            int cur = examinerIds == null ? 0 : examinerIds.size();
            if (cur == 0) un++; 
            else if (cur >= req && req > 0) fully++; 
            else partial++;
        }
        
        resp.setSessions(items);
        AdminSessionsListResponseDTO.Summary sum = new AdminSessionsListResponseDTO.Summary();
        sum.setTotalSessions(items.size());
        sum.setFullyStaffed(fully);
        sum.setPartiallyStaffed(partial);
        sum.setUnstaffed(un);
        resp.setSummary(sum);
        
        return resp;
    }

    @Override
    @Transactional
    public SessionDetailDTO updateSession(Long assignmentId, Long sessionId, SessionRequestDTO request) {
        SlotSession s = slotSessionMapper.selectById(sessionId);
        if (s == null || !assignmentId.equals(s.getAssignmentId())) {
            throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        }
        LocalDateTime startAt = request.getDate().atTime(request.getStartTime());
        LocalDateTime endAt = request.getDate().atTime(request.getEndTime());
        if (!endAt.isAfter(startAt)) throw new BusinessException(BusinessError.INVALID_PARAM);
        // Validate venue: must exist and belong to the assignment
        if (request.getVenueId() != null) {
            Venue v = venueMapper.selectById(request.getVenueId());
            if (v == null) {
                throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
            }
            if (v.getAssignmentId() == null || !assignmentId.equals(v.getAssignmentId())) {
                throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
            }
            s.setVenueId(request.getVenueId());
        }
        // overlap check
        int overlap = slotSessionMapper.countVenueOverlap(assignmentId, s.getVenueId(), startAt, startAt, endAt, sessionId);
        if (overlap > 0) throw new BusinessException(BusinessError.VENUE_SESSION_OVERLAP);
        s.setStartAt(startAt);
        s.setEndAt(endAt);
        if (request.getRequiredExaminers() != null) s.setRequiredExaminers(request.getRequiredExaminers());
        if (request.getCapacity() != null) s.setCapacityGroups(request.getCapacity());
        s.setUpdatedAt(LocalDateTime.now());
        slotSessionMapper.updateById(s);
        SessionDetailDTO dto = new SessionDetailDTO();
        dto.setId(s.getSessionId());
        dto.setStartTime(s.getStartAt().toLocalTime());
        dto.setEndTime(s.getEndAt().toLocalTime());
        dto.setStatus(s.getStatus());
        dto.setSessionNumber(s.getSessionNumber());
        dto.setBookedBy(null);
        return dto;
    }

    @Override
    @Transactional
    public Map<String, Object> deleteSessions(Long assignmentId, List<Long> sessionIds) {
        if (sessionIds == null || sessionIds.isEmpty()) throw new BusinessException(BusinessError.INVALID_PARAM);
        // Existence check + booking occupancy check
        List<Long> blocked = new ArrayList<>();
        for (Long id : sessionIds) {
            SlotSession s = slotSessionMapper.selectById(id);
            if (s == null || !assignmentId.equals(s.getAssignmentId())) throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
            int enrolled = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            if (enrolled > 0) blocked.add(id);
        }
        if (!blocked.isEmpty()) {
            throw new BusinessException(BusinessError.SESSION_HAS_BOOKINGS);
        }
        int deleted = 0;
        for (Long id : sessionIds) {
            // Cascade deletion handled by foreign keys, or delete relations first
            sessionExaminerMapper.delete(new QueryWrapper<SessionExaminer>().eq("session_id", id));
            deleted += slotSessionMapper.deleteById(id);
        }
        Map<String,Object> resp = new HashMap<>();
        resp.put("deletedCount", deleted);
        resp.put("deletedIds", sessionIds);
        return resp;
    }

    @Override
    @Transactional
    public Map<String, Object> updateSessionsExaminers(Long assignmentId, UpdateSessionsExaminersRequestDTO request) {
        if (request.getSessionIds() == null || request.getSessionIds().isEmpty()) throw new BusinessException(BusinessError.INVALID_PARAM);
        if (request.getExaminerIds() == null || request.getExaminerIds().isEmpty()) throw new BusinessException(BusinessError.INVALID_PARAM);
        String action = request.getAction() == null ? "" : request.getAction().toLowerCase();
        if (! Arrays.asList("add","remove","set").contains(action)) throw new BusinessException(BusinessError.INVALID_PARAM);

        // Read all target sessions
        List<SlotSession> sessions = new ArrayList<>();
        for (Long sid : request.getSessionIds()) {
            SlotSession s = slotSessionMapper.selectById(sid);
            if (s == null || !assignmentId.equals(s.getAssignmentId())) throw new BusinessException("Session not found");
            sessions.add(s);
        }

        // Unified validation: examinerId must be an examiner role
        for (Long examinerId : request.getExaminerIds()) {
            boolean isExaminer = sysUserMapper.existsUserWithRoles(examinerId, java.util.Collections.singletonList(UserRole.EXAMINER.code()));
            if (!isExaminer) {
                throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
            }
        }

        // Validate: time conflicts and limits (only for add/set). For set, ignore pseudo-conflicts with target sessions themselves.
        if (action.equals("add") || action.equals("set")) {
            Set<Long> targetSessionIds = new HashSet<>(request.getSessionIds());
            for (Long examinerId : request.getExaminerIds()) {
                // Limit validation (if personalized limit configured)
                ExaminerAssignmentLimit lim = limitMapper.findByExaminerAndAssignment(examinerId, assignmentId);
                Integer maxSessions = lim == null ? null : lim.getMaxSessions();
                if (maxSessions != null && maxSessions > 0) {
                    int current = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, examinerId);
                    int toAssign = sessions.size();
                    if (action.equals("set")) {
                        int already = 0;
                        for (SlotSession s : sessions) {
                            List<Long> exist = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
                            if (exist != null && exist.contains(examinerId)) already++;
                        }
                        toAssign = toAssign - already;
                    }
                    if (current + toAssign > maxSessions) throw new BusinessException(BusinessError.EXCEEDS_MAX_SESSIONS);
                }
                for (SlotSession s : sessions) {
                    List<Long> conflicted = sessionExaminerMapper.findConflictedSessionsForExaminer(examinerId, s.getStartAt(), s.getEndAt());
                    if (conflicted != null && !conflicted.isEmpty()) {
                        if (action.equals("set")) {
                            // Filter out conflicts that are exactly the target sessions in this set operation
                            boolean hasRealConflict = false;
                            for (Long cid : conflicted) {
                                if (!targetSessionIds.contains(cid)) { hasRealConflict = true; break; }
                            }
                            if (hasRealConflict) throw new BusinessException(BusinessError.EXAMINER_TIME_CONFLICT);
                        } else {
                            throw new BusinessException(BusinessError.EXAMINER_TIME_CONFLICT);
                        }
                    }
                }
            }
        }

        // Execute
        if (action.equals("set")) {
            // Clear first, then add
            for (SlotSession s : sessions) {
                sessionExaminerMapper.delete(new QueryWrapper<SessionExaminer>().eq("session_id", s.getSessionId()));
            }
        }
        if (action.equals("remove") || action.equals("set")) {
            for (SlotSession s : sessions) {
                for (Long examinerId : request.getExaminerIds()) {
                    sessionExaminerMapper.deleteOne(s.getSessionId(), examinerId);
                }
            }
        }
        if (action.equals("add") || action.equals("set")) {
            for (SlotSession s : sessions) {
                for (Long examinerId : request.getExaminerIds()) {
                    assignExaminer(s.getSessionId(), examinerId, null);
                }
            }
        }

        Map<String,Object> resp = new HashMap<>();
        resp.put("updatedSessionIds", request.getSessionIds());
        return resp;
    }

    @Override
    @Transactional
    public boolean publishSessionToExaminer(Long sessionId, boolean value) {
        SlotSession s = slotSessionMapper.selectById(sessionId);
        if (s == null) throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        s.setIsPublishedToExaminer(value);
        s.setUpdatedAt(LocalDateTime.now());
        return slotSessionMapper.updateById(s) > 0;
    }

    @Override
    @Transactional
    public boolean publishSessionToStudent(Long sessionId, boolean value) {
        SlotSession s = slotSessionMapper.selectById(sessionId);
        if (s == null) throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        if (value) {
            // Must satisfy required examiners for the session (cur >= requiredExaminers; default 1 if not set)
            List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(sessionId);
            int cur = examiners == null ? 0 : examiners.size();
            int req = (s.getRequiredExaminers() == null || s.getRequiredExaminers() <= 0) ? 1 : s.getRequiredExaminers();
            if (cur < req) {
                throw new BusinessException(BusinessError.SESSION_NOT_STAFFED);
            }
        }
        s.setIsPublishedToStudent(value);
        s.setUpdatedAt(LocalDateTime.now());
        return slotSessionMapper.updateById(s) > 0;
    }

    @Override
    @Transactional
    public boolean publishAssignmentToExaminer(Long assignmentId, boolean value) {
        if (value) {
            // Total capacity validation: sum of personalized max limits must be >= sum of requiredExaminers across all sessions
            List<SlotSession> allSessions = slotSessionMapper.listSessionsByAssignment(assignmentId);
            int totalRequired = 0;
            if (allSessions != null) {
                for (SlotSession s : allSessions) {
                    int req = (s.getRequiredExaminers() == null || s.getRequiredExaminers() <= 0) ? 1 : s.getRequiredExaminers();
                    totalRequired += req;
                }
            }
            int sumLimits = 0;
            // Count only examiners with personalized limits by reading examiner_assignment_limit table
            List<ExaminerAssignmentLimit> limits = limitMapper.selectList(
                    new QueryWrapper<ExaminerAssignmentLimit>()
                            .eq("assignment_id", assignmentId)
                            .gt("max_sessions", 0)
            );
            if (limits != null) {
                for (ExaminerAssignmentLimit l : limits) {
                    Integer ms = l.getMaxSessions();
                    if (ms != null && ms > 0) {
                        sumLimits += ms;
                    }
                }
            }
            if (sumLimits < totalRequired) {
                throw new BusinessException(BusinessError.TOTAL_EXAMINER_CAPACITY_INSUFFICIENT);
            }
        }
        // Update assignment.status: true -> IN_PROGRESS; false -> PENDING
        Assignment a = assignmentMapper.selectById(assignmentId);
        if (a == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        a.setStatus(value ? "IN_PROGRESS" : "PENDING");
        a.setUpdateTime(LocalDateTime.now());
        return assignmentMapper.updateById(a) > 0;
    }

    @Override
    @Transactional
    public boolean publishAssignmentToStudent(Long assignmentId, boolean value) {
        // Publish to students: true -> validate all sessions are staffed; then assignment.status=RELEASED and isReleased=true, releasedAt=now
        // Unpublish: assignment.status=IN_PROGRESS, isReleased=false
        org.swen90017.oas.entity.Assignment a = assignmentMapper.selectById(assignmentId);
        if (a == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        if (value) {
            List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(assignmentId, null, null);
            for (SlotSession s : sessions) {
                List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
                int cur = examiners == null ? 0 : examiners.size();
                int req = (s.getRequiredExaminers() == null || s.getRequiredExaminers() <= 0) ? 1 : s.getRequiredExaminers();
                if (cur < req) {
                    throw new BusinessException(BusinessError.SESSION_NOT_STAFFED);
                }
            }
            a.setStatus("RELEASED");
            a.setIsReleased(Boolean.TRUE);
            a.setReleasedAt(LocalDateTime.now());
            
            // Additional operations when publishing to students:
            // 1) Update students' if_join in assignment_participant to 1
            // 2) Send course-join notification email to students
            updateStudentParticipationAndSendNotification(assignmentId);
        } else {
            a.setStatus("IN_PROGRESS");
            a.setIsReleased(Boolean.FALSE);
            a.setReleasedAt(null);
            
            // When unpublishing, set students' if_join back to 0
            updateStudentParticipationStatus(assignmentId, 0);
        }
        a.setUpdateTime(LocalDateTime.now());
        return assignmentMapper.updateById(a) > 0;
    }

    @Override
    public CalendarResponseDTO getSessionCalendar(Long assignmentId, String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.atEndOfMonth().atTime(23,59,59);
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(assignmentId, from, to);
        Map<String, CalendarResponseDTO.DateInfoDTO> map = new LinkedHashMap<>();
        for (SlotSession s : sessions) {
            String key = s.getStartAt().toLocalDate().toString();
            CalendarResponseDTO.DateInfoDTO di = map.computeIfAbsent(key, k -> new CalendarResponseDTO.DateInfoDTO());
            di.setSessions((di.getSessions() == null ? 0 : di.getSessions()) + 1);
            // Staffing status
            List<Long> ex = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            int cur = ex == null ? 0 : ex.size();
            int req = s.getRequiredExaminers() == null ? 0 : s.getRequiredExaminers();
            if (req > 0 && cur >= req) {
                di.setFullyStaffed((di.getFullyStaffed() == null ? 0 : di.getFullyStaffed()) + 1);
            } else if (cur > 0) {
                di.setPartialStaffed((di.getPartialStaffed() == null ? 0 : di.getPartialStaffed()) + 1);
            } else {
                di.setNoStaffed((di.getNoStaffed() == null ? 0 : di.getNoStaffed()) + 1);
            }
            // Bookable/full statistics (based on capacity)
            int cap = s.getCapacityGroups() == null ? 1 : s.getCapacityGroups();
            int booked = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            if (booked >= cap) {
                di.setFullSessions((di.getFullSessions() == null ? 0 : di.getFullSessions()) + 1);
            } else {
                di.setBookableSessions((di.getBookableSessions() == null ? 0 : di.getBookableSessions()) + 1);
            }

            // Items details
            List<CalendarResponseDTO.CalendarItem> items = di.getItems();
            if (items == null) {
                items = new java.util.ArrayList<>();
                di.setItems(items);
            }
            CalendarResponseDTO.CalendarItem item = new CalendarResponseDTO.CalendarItem();
            item.setId(s.getSessionId());
            item.setType("session");
            item.setStatus(s.getStatus() == null ? null : s.getStatus().name().toLowerCase());
            item.setStart(s.getStartAt().toLocalTime());
            item.setEnd(s.getEndAt().toLocalTime());
            item.setVenueId(s.getVenueId());
            if (s.getVenueId() != null) {
                Venue v = venueMapper.selectById(s.getVenueId());
                item.setVenueName(v == null ? null : v.getRoomName());
            }
            items.add(item);
        }
        CalendarResponseDTO dto = new CalendarResponseDTO();
        dto.setMonth(month);
        dto.setDates(map);
        return dto;
    }

    @Override
    public Map<String, Object> getAssignmentPublishStatus(Long assignmentId) {
        Assignment a = assignmentMapper.selectById(assignmentId);
        if (a == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        String st = a.getStatus();
        boolean toExaminer = "IN_PROGRESS".equalsIgnoreCase(st) || "RELEASED".equalsIgnoreCase(st);
        boolean toStudent = Boolean.TRUE.equals(a.getIsReleased()) || "RELEASED".equalsIgnoreCase(st);
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", st);
        resp.put("publishedToExaminer", toExaminer);
        resp.put("publishedToStudent", toStudent);
        resp.put("releasedAt", a.getReleasedAt());
        return resp;
    }

    @Override
    public Map<String, Boolean> getPublishStatus(Long sessionId) {
        SlotSession s = slotSessionMapper.selectById(sessionId);
        if (s == null) throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        Map<String, Boolean> m = new HashMap<>();
        m.put("publishedToExaminer", Boolean.TRUE.equals(s.getIsPublishedToExaminer()));
        m.put("publishedToStudent", Boolean.TRUE.equals(s.getIsPublishedToStudent()));
        return m;
    }
    
    /**
     * On publishing to students: update students' if_join status and send notification emails
     */
    private void updateStudentParticipationAndSendNotification(Long assignmentId) {
        log.info("Start post-release operations for assignment {} to students", assignmentId);
        
        // 1) Update students' if_join status to 1
        updateStudentParticipationStatus(assignmentId, 1);
        
        // 2) Fetch assignment and course information
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            log.warn("Assignment not found. assignmentId: {}", assignmentId);
            return;
        }
        
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseName = subject != null ? subject.getSubjectName() : null;
        String assignmentName = assignment.getName();
        
        // 3) Query all student participants of this assignment
        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId)
               .eq("role_id", UserRole.STUDENT.sort())
               .eq("if_join", 1); // Only query students with if_join = 1
        List<AssignmentParticipant> studentParticipants = assignmentParticipantMapper.selectList(wrapper);
        
        if (studentParticipants.isEmpty()) {
            log.info("No student participants found for this assignment. Skip sending notifications");
            return;
        }
        
        // 4) Fetch user information for these students
        List<Long> userIds = studentParticipants.stream()
                .map(AssignmentParticipant::getUserId)
                .collect(java.util.stream.Collectors.toList());
        
        List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
        
        // 5) Filter registered users
        List<SysUser> registeredUsers = users.stream()
                .filter(user -> UserStatus.ACTIVE.code().equals(user.getStatus()) 
                        && RegistrationStatus.REGISTERED.code().equals(user.getRegistrationStatus()))
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Preparing to send release notifications to {} registered students", registeredUsers.size());
        
        // 6) Send notification emails
        if (!registeredUsers.isEmpty()) {
            emailService.sendCourseJoinNotification(registeredUsers, courseName, assignmentName);
            log.info("Release notifications sent to students successfully");
        }
    }
    
    /**
     * Update students' if_join status
     */
    private void updateStudentParticipationStatus(Long assignmentId, int ifJoinValue) {
        log.info("Updating students' if_join status to {} for assignment {}", ifJoinValue, assignmentId);
        
        // Perform updates: only update records for student role
        QueryWrapper<AssignmentParticipant> updateWrapper = new QueryWrapper<>();
        updateWrapper.eq("assignment_id", assignmentId)
                    .eq("role_id", UserRole.STUDENT.sort());
        
        List<AssignmentParticipant> participants = assignmentParticipantMapper.selectList(updateWrapper);
        for (AssignmentParticipant participant : participants) {
            participant.setIfJoin(ifJoinValue);
            assignmentParticipantMapper.updateById(participant);
        }
        
        log.info("Successfully updated if_join status for {} student participant records", participants.size());
    }
}


