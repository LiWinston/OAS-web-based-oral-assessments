package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.entity.SessionExaminer;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.enums.AssignMode;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.service.SessionService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionServiceImpl implements SessionService {

    private final SessionExaminerMapper sessionExaminerMapper;
    private final SlotSessionMapper slotSessionMapper;

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
            throw new BusinessException("Session not found");
        }

        // 冲突校验
        List<Long> conflicts = sessionExaminerMapper.findConflictedSessionsForExaminer(
                examinerId, session.getStartAt(), session.getEndAt());
        if (conflicts != null && !conflicts.isEmpty()) {
            throw new BusinessException("Examiner has time conflict");
        }

        // 重复校验
        List<Long> existing = sessionExaminerMapper.listExaminerIdsBySession(sessionId);
        if (existing != null && new HashSet<>(existing).contains(examinerId)) {
            return false;
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
        int rows = sessionExaminerMapper.deleteOne(sessionId, examinerId);
        return rows > 0;
    }

    @Override
    @Transactional
    public int batchCreateSessions(Long assignmentId, List<org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO.SessionWindowDTO> windows) {
        if (windows == null || windows.isEmpty()) {
            return 0;
        }
        List<SlotSession> toInsert = new java.util.ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (BatchCreateSessionsRequestDTO.SessionWindowDTO w : windows) {
            LocalDateTime startAt = w.getDate().atTime(w.getStartTime());
            LocalDateTime endAt = w.getDate().atTime(w.getEndTime());
            if (!endAt.isAfter(startAt)) {
                throw new BusinessException("Invalid session window");
            }

            // 简化：按 sessionCount 均分；若未提供则整个窗口作为 1 个会话
            int count = (w.getSessionCount() == null || w.getSessionCount() <= 0) ? 1 : w.getSessionCount();
            long totalMinutes = Duration.between(startAt, endAt).toMinutes();
            long per = Math.max(1, totalMinutes / count);
            LocalDateTime cursor = startAt;
            for (int i = 1; i <= count; i++) {
                SlotSession s = new SlotSession();
                s.setAssignmentId(assignmentId);
                s.setSlotId(null); // 不再依赖 timeslot
                s.setSessionNumber(i);
                s.setStartAt(cursor);
                LocalDateTime segEnd = (i == count) ? endAt : cursor.plusMinutes(per);
                s.setEndAt(segEnd);
                s.setStatus(SessionStatus.AVAILABLE);
                s.setVenueId(w.getVenueId());
                s.setCapacityGroups(1);
                s.setEnrolledGroups(0);
                s.setAssignMode(AssignMode.INDIVIDUAL);
                s.setIsPublishedToExaminer(false);
                s.setIsPublishedToStudent(false);
                s.setIsStaffed(false);
                s.setCreatedAt(now);
                s.setUpdatedAt(now);
                toInsert.add(s);
                cursor = segEnd;
            }
        }
        if (!toInsert.isEmpty()) {
            slotSessionMapper.batchInsert(toInsert);
        }
        return toInsert.size();
    }
}


