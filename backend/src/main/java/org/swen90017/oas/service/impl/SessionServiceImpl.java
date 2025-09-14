package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.entity.SessionExaminer;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.enums.AssignMode;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.service.SessionService;
import org.swen90017.oas.dto.response.AdminSessionsListResponseDTO;
import org.swen90017.oas.dto.response.SessionDetailDTO;
import org.swen90017.oas.dto.request.SessionRequestDTO;
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.enums.UserRole;

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
    private final SlotSessionMapper slotSessionMapper;
    private final VenueMapper venueMapper;
    private final SysUserMapper sysUserMapper;
    private final AssignmentMapper assignmentMapper;

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

        // 身份校验：必须是考官角色
        boolean isExaminer = sysUserMapper.existsUserWithRoles(examinerId, java.util.Collections.singletonList(UserRole.EXAMINER.code()));
        if (!isExaminer) {
            throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
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

        // 容量校验：已分配数量不能超过 requiredExaminers
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
        int rows = sessionExaminerMapper.deleteOne(sessionId, examinerId);
        return rows > 0;
    }

    @Override
    @Transactional
    public int batchCreateSessions(Long assignmentId, List<org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO.SessionWindowDTO> windows) {
        if (windows == null || windows.isEmpty()) {
            return 0;
        }
        // 1) 构建候选切片
        List<SlotSession> toInsert = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (BatchCreateSessionsRequestDTO.SessionWindowDTO w : windows) {
            LocalDateTime startAt = w.getDate().atTime(w.getStartTime());
            LocalDateTime endAt = w.getDate().atTime(w.getEndTime());
            if (!endAt.isAfter(startAt)) {
                throw new BusinessException(BusinessError.INVALID_PARAM);
            }

            // 校验 venue 合法性（存在且属于 assignment）
            if (w.getVenueId() != null) {
                Venue v = venueMapper.selectById(w.getVenueId());
                if (v == null) {
                    throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
                }
                if (v.getAssignmentId() == null || !assignmentId.equals(v.getAssignmentId())) {
                    throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
                }
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
        // 2) 整批预校验：与 DB 重叠
        for (SlotSession s : toInsert) {
            if (s.getVenueId() == null) continue;
            int overlap = slotSessionMapper.countVenueOverlap(assignmentId, s.getVenueId(), s.getStartAt(), s.getStartAt(), s.getEndAt(), null);
            if (overlap > 0) {
                throw new BusinessException(BusinessError.SESSION_CONFLICT);
            }
        }
        // 3) 整批预校验：批内互相重叠（同 venue 同日）
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
        // 简化：按日期范围查询并在内存过滤 status/venue
        LocalDate target = (date == null || date.isEmpty()) ? null : LocalDate.parse(date);
        LocalDateTime from = target == null ? null : target.atStartOfDay();
        LocalDateTime to = target == null ? null : target.atTime(23,59,59);
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(assignmentId, from, to);
        AdminSessionsListResponseDTO resp = new AdminSessionsListResponseDTO();
        List<AdminSessionsListResponseDTO.Item> items = new ArrayList<>();
        int fully = 0, partial = 0, un = 0;
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
            int booked = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            it.setBookedCount(booked);
            int cap = s.getCapacityGroups() == null ? 1 : s.getCapacityGroups();
            it.setRemainingCapacity(Math.max(0, cap - booked));
            it.setStatus(s.getStatus().name().toLowerCase());
            it.setCreatedAt(s.getCreatedAt());
            it.setLastModified(s.getUpdatedAt());
            // 基于 assignment.status 派生发布布尔位
            org.swen90017.oas.entity.Assignment a = assignmentMapper.selectById(s.getAssignmentId());
            String st = a == null ? null : a.getStatus();
            boolean toExaminer = "IN_PROGRESS".equalsIgnoreCase(st) || "RELEASED".equalsIgnoreCase(st);
            boolean toStudent = "RELEASED".equalsIgnoreCase(st);
            it.setPublishedToExaminer(toExaminer);
            it.setPublishedToStudent(toStudent);
            items.add(it);
            int req = s.getRequiredExaminers() == null ? 0 : s.getRequiredExaminers();
            int cur = examinerIds == null ? 0 : examinerIds.size();
            if (cur == 0) un++; else if (cur >= req && req > 0) fully++; else partial++;
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
        // 校验场地：存在且属于该 assignment
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
        // 存在性校验 + 预订占用校验
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
            // 级联删除交由外键或先删关联
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

        // 读取所有目标会话
        List<SlotSession> sessions = new ArrayList<>();
        for (Long sid : request.getSessionIds()) {
            SlotSession s = slotSessionMapper.selectById(sid);
            if (s == null || !assignmentId.equals(s.getAssignmentId())) throw new BusinessException("Session not found");
            sessions.add(s);
        }

        // 统一校验：examinerId 必须为考官角色
        for (Long examinerId : request.getExaminerIds()) {
            boolean isExaminer = sysUserMapper.existsUserWithRoles(examinerId, java.util.Collections.singletonList(UserRole.EXAMINER.code()));
            if (!isExaminer) {
                throw new BusinessException(BusinessError.EXAMINER_NOT_FOUND);
            }
        }

        // 校验：时间冲突（仅对 add/set 生效）。set 操作忽略与自身目标会话的“伪冲突”。
        if (action.equals("add") || action.equals("set")) {
            Set<Long> targetSessionIds = new HashSet<>(request.getSessionIds());
            for (Long examinerId : request.getExaminerIds()) {
                for (SlotSession s : sessions) {
                    List<Long> conflicted = sessionExaminerMapper.findConflictedSessionsForExaminer(examinerId, s.getStartAt(), s.getEndAt());
                    if (conflicted != null && !conflicted.isEmpty()) {
                        if (action.equals("set")) {
                            // 过滤掉与本次 set 的目标会话相同的冲突记录
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

        // 执行
        if (action.equals("set")) {
            // 先清空后添加
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
            // 需要满足会话规定的考官人数（cur >= requiredExaminers，若未配置则按 1）
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
        // 改为更新 assignment.status：true -> IN_PROGRESS；false -> PENDING
        org.swen90017.oas.entity.Assignment a = assignmentMapper.selectById(assignmentId);
        if (a == null) throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        a.setStatus(value ? "IN_PROGRESS" : "PENDING");
        a.setUpdateTime(LocalDateTime.now());
        return assignmentMapper.updateById(a) > 0;
    }

    @Override
    @Transactional
    public boolean publishAssignmentToStudent(Long assignmentId, boolean value) {
        // 发布给学生：true -> 校验所有 sessions 已配员；然后 assignment.status=RELEASED 且 isReleased=true, releasedAt=now
        // 取消发布：assignment.status=IN_PROGRESS, isReleased=false
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
        } else {
            a.setStatus("IN_PROGRESS");
            a.setIsReleased(Boolean.FALSE);
            a.setReleasedAt(null);
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
            // staffing 状态
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
            // bookable/full 统计（基于容量）
            int cap = s.getCapacityGroups() == null ? 1 : s.getCapacityGroups();
            int booked = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
            if (booked >= cap) {
                di.setFullSessions((di.getFullSessions() == null ? 0 : di.getFullSessions()) + 1);
            } else {
                di.setBookableSessions((di.getBookableSessions() == null ? 0 : di.getBookableSessions()) + 1);
            }

            // items 明细
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
    public Map<String, Boolean> getPublishStatus(Long sessionId) {
        SlotSession s = slotSessionMapper.selectById(sessionId);
        if (s == null) throw new BusinessException(BusinessError.SESSION_NOT_FOUND);
        Map<String, Boolean> m = new HashMap<>();
        m.put("publishedToExaminer", Boolean.TRUE.equals(s.getIsPublishedToExaminer()));
        m.put("publishedToStudent", Boolean.TRUE.equals(s.getIsPublishedToStudent()));
        return m;
    }
}


