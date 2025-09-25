package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.AssignExaminersRequestDTO;
import org.swen90017.oas.dto.response.GetAvailableExaminersResponseDTO;
import org.swen90017.oas.dto.response.ExaminerDetailDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;
import org.swen90017.oas.dto.response.SessionDetailDTO;
import org.swen90017.oas.entity.AssignmentSessionConfig;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.TimeSlot;
import org.swen90017.oas.entity.TimeSlotExaminer;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.AdminExaminerService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminExaminerServiceImpl implements AdminExaminerService {
    @Autowired
    private AssignmentSessionConfigMapper configMapper;
    @Autowired
    private TimeSlotMapper timeSlotMapper;
    @Autowired
    private TimeSlotExaminersMapper tseMapper;
    @Autowired
    private SlotSessionMapper slotSessionMapper;
    @Autowired
    private org.swen90017.oas.mapper.SessionExaminerMapper sessionExaminerMapper;
    @Autowired
    private SysUserMapper sysUserMapper;
    @Autowired
    private ExaminerAssignmentLimitMapper limitMapper;
    @Autowired
    private AssignmentParticipantMapper assignmentParticipantMapper;
    @Autowired
    private AssignmentMapper assignmentMapper;

    @Override
    public GetAvailableExaminersResponseDTO getAvailableExaminers(Long assignmentId, Long timeSlotId) {
        AssignmentSessionConfig cfg = configMapper.selectById(assignmentId);
        int defaultMax = (cfg == null || cfg.getDefaultMaxSessionsPerExaminer() == null)
                ? 0 : cfg.getDefaultMaxSessionsPerExaminer();
        List<Long> examinerUserIds = assignmentParticipantMapper.listExaminerUserIdsByAssignment(assignmentId);
        List<SysUser> users = (examinerUserIds == null || examinerUserIds.isEmpty())
                ? new ArrayList<>()
                : sysUserMapper.selectBatchIds(examinerUserIds);
        List<ExaminerDetailDTO> list = new ArrayList<>();
        LocalDateTime slotStart = null;
        LocalDateTime slotEnd = null;
        if (timeSlotId != null) {
            TimeSlot ts = timeSlotMapper.selectById(timeSlotId);
            if (ts != null) {
                slotStart = ts.getStartAt();
                slotEnd = ts.getEndAt();
            }
        }
        for (SysUser u : users) {
            ExaminerDetailDTO dto = new ExaminerDetailDTO();
            dto.setId(u.getUserId());
            dto.setName(u.getUserName());
            dto.setEmail(u.getEmail());
            // Personalized limit takes precedence; otherwise use default
            ExaminerAssignmentLimit lim = limitMapper.findByExaminerAndAssignment(u.getUserId(), assignmentId);
            int max = (lim != null && lim.getMaxSessions() != null) ? lim.getMaxSessions() : defaultMax;
            dto.setMaxSessions(max);
            // Total number of sessions assigned for this assignment (count via session_examiners by assignment)
            int assigned = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, u.getUserId());
            dto.setCurrentAssignments(assigned);
            // Conflict check: if timeSlotId is provided, check conflicts with already assigned slots within that time window
            boolean hasConflict = false;
            if (slotStart != null && slotEnd != null) {
                List<Long> conflicted = tseMapper.findConflictedSlotsForExaminer(u.getUserId(), slotStart, slotEnd);
                hasConflict = conflicted != null && !conflicted.isEmpty();
            }
            // Availability: must satisfy capacity and have no conflicts
            String availability = (max == 0 || assigned < max) && !hasConflict ? "available" : "unavailable";
            dto.setAvailability(availability);
            list.add(dto);
        }
        GetAvailableExaminersResponseDTO resp = new GetAvailableExaminersResponseDTO();
        resp.setExaminers(list);
        return resp;
    }

    private List<SysUser> baseListExaminers() {
        return sysUserMapper.selectByRoleKey(UserRole.EXAMINER.code());
    }

    @Override
    @Transactional
    public TimeSlotDetailDTO assignExaminersToSlot(Long assignmentId, Long timeSlotId, AssignExaminersRequestDTO request) {
        // Validate that the slot belongs to the assignment
        TimeSlot slot = timeSlotMapper.selectById(timeSlotId);
        if (slot == null || !slot.getAssignmentId().equals(assignmentId)) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }
        // Disallow assignment changes after Released
        if (Boolean.TRUE.equals(assignmentMapper.isReleased(assignmentId))) {
            throw new BusinessException(CommonError.FORBIDDEN);
        }

        // Read already assigned examiners and prepare incremental insert list (dedupe and exclude existing)
        List<Long> alreadyAssigned = tseMapper.listExaminerIdsBySlot(timeSlotId);
        Set<Long> uniqueIds = new HashSet<>(request.getExaminerIds());
        Set<Long> toInsertIds = new HashSet<>();
        if (alreadyAssigned == null || alreadyAssigned.isEmpty()) {
            toInsertIds.addAll(uniqueIds);
        } else {
            for (Long id : uniqueIds) {
                if (!alreadyAssigned.contains(id)) {
                    toInsertIds.add(id);
                }
            }
        }

        // Validate that we do not exceed requiredExaminers limit
        int currentCount = alreadyAssigned == null ? 0 : alreadyAssigned.size();
        int finalCount = currentCount + toInsertIds.size();
        if (slot.getRequiredExaminers() != null && finalCount > slot.getRequiredExaminers()) {
            throw new BusinessException(BusinessError.EXCEEDS_REQUIRED_EXAMINERS);
        }

        List<TimeSlotExaminer> rows = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        Long operatorId = null; // Can be obtained from login context
        for (Long examinerId : toInsertIds) {
            TimeSlotExaminer e = new TimeSlotExaminer();
            e.setSlotId(timeSlotId);
            e.setExaminerId(examinerId);
            e.setAssignedAt(now);
            e.setAssignedBy(operatorId);
            rows.add(e);
        }
        if (!rows.isEmpty()) {
            tseMapper.batchInsert(rows);
        }

        // Update slot's currentExaminers and status
        List<Long> assignedIds = tseMapper.listExaminerIdsBySlot(timeSlotId);
        int currentExaminers = assignedIds == null ? 0 : assignedIds.size();
        int booked = slotSessionMapper.countBookedBySlot(timeSlotId);
        timeSlotMapper.updateCountersAndStatus(timeSlotId, currentExaminers, booked);

        // Return latest detail (including sessions and assigned examiners)
        TimeSlot refreshed = timeSlotMapper.selectById(timeSlotId);
        return buildTimeSlotDetail(refreshed);
    }

    private TimeSlotDetailDTO buildTimeSlotDetail(TimeSlot timeSlot) {
        TimeSlotDetailDTO dto = new TimeSlotDetailDTO();
        dto.setId(timeSlot.getSlotId());
        dto.setDate(timeSlot.getSlotDate());
        dto.setStartTime(timeSlot.getStartAt().toLocalTime());
        dto.setEndTime(timeSlot.getEndAt().toLocalTime());
        dto.setVenueId(timeSlot.getVenueId());
        dto.setRequiredExaminers(timeSlot.getRequiredExaminers());
        dto.setSessionCount(timeSlot.getSessionCount());
        dto.setStatus(timeSlot.getStatus());
        dto.setBookedSessions(timeSlot.getBookedSessions());
        dto.setCreatedAt(timeSlot.getCreatedAt());
        dto.setLastModified(timeSlot.getUpdatedAt());

        // Sessions
        java.util.List<SlotSession> sessions = slotSessionMapper.findBySlotId(timeSlot.getSlotId());
        java.util.List<SessionDetailDTO> sessionDTOs = new java.util.ArrayList<>();
        if (sessions != null) {
            for (SlotSession s : sessions) {
                SessionDetailDTO sd = new SessionDetailDTO();
                sd.setId(s.getSessionId());
                sd.setStartTime(s.getStartAt().toLocalTime());
                sd.setEndTime(s.getEndAt().toLocalTime());
                sd.setStatus(s.getStatus());
                sd.setSessionNumber(s.getSessionNumber());
                sd.setBookedBy(null);
                sessionDTOs.add(sd);
            }
        }
        dto.setSessions(sessionDTOs);

        // Assigned examiners (with user info)
        java.util.List<Long> examinerIds = tseMapper.listExaminerIdsBySlot(timeSlot.getSlotId());
        java.util.List<org.swen90017.oas.dto.response.ExaminerDetailDTO> assigned = new java.util.ArrayList<>();
        if (examinerIds != null && !examinerIds.isEmpty()) {
            java.util.List<org.swen90017.oas.entity.SysUser> users = sysUserMapper.selectBatchIds(examinerIds);
            for (org.swen90017.oas.entity.SysUser u : users) {
                org.swen90017.oas.dto.response.ExaminerDetailDTO ed = new org.swen90017.oas.dto.response.ExaminerDetailDTO();
                ed.setId(u.getUserId());
                ed.setName(u.getUserName());
                ed.setEmail(u.getEmail());
                assigned.add(ed);
            }
        }
        dto.setAssignedExaminers(assigned);

        return dto;
    }
}
