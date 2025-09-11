package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.dto.request.ExaminerSessionLimitDTO;
import org.swen90017.oas.dto.request.ReleaseScheduleRequestDTO;
import org.swen90017.oas.dto.request.UpdateExaminerSessionLimitsRequestDTO;
import org.swen90017.oas.dto.response.ReleaseScheduleResponseDTO;
import org.swen90017.oas.dto.response.ScheduleStatusResponseDTO;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentSessionConfigMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.ExaminerAssignmentLimitMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.mapper.SessionExaminerMapper;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.ScheduleService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Schedule Service Implementation
 * Implements operations for schedule management and release
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleServiceImpl implements ScheduleService {

    private final AssignmentMapper assignmentMapper;
    private final AssignmentSessionConfigMapper assignmentSessionConfigMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final ExaminerAssignmentLimitMapper examinerAssignmentLimitMapper;
    private final EmailService emailService;
    private final SlotSessionMapper slotSessionMapper;
    private final SessionExaminerMapper sessionExaminerMapper;

    @Override
    public ScheduleStatusResponseDTO getScheduleStatus(Long assignmentId) {
        // Check if assignment exists
        String currentStatus = assignmentMapper.getScheduleStatus(assignmentId);
        if (currentStatus == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        Boolean isReleased = assignmentMapper.isReleased(assignmentId);
        
        // 获取会话进行分析（过渡期仍通过 slot 关联取 sessions）
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignment(assignmentId);
        List<String> issues = new ArrayList<>();
        ScheduleStatusResponseDTO.ScheduleSummaryDTO summary = analyzeSessions(sessions, issues);
        
        ScheduleStatusResponseDTO response = new ScheduleStatusResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setScheduleStatus(isReleased ? "released" : "draft");
        response.setIsReleased(isReleased);
        response.setTotalTimeSlots(null); // timeslot已逐步移除，此字段置空或改名（保持DTO兼容）
        response.setReadyForRelease(issues.isEmpty());
        response.setIssues(issues);
        response.setSummary(summary);
        
        return response;
    }

    @Override
    @Transactional
    public ReleaseScheduleResponseDTO releaseSchedule(Long assignmentId, ReleaseScheduleRequestDTO request) {
        String audience = request.getAudience() == null ? "examiners" : request.getAudience().toLowerCase();
        LocalDateTime releasedAt = LocalDateTime.now();
        if ("examiners".equals(audience)) {
            // 发布给考官：将所有会话标记 is_published_to_examiner = true
            List<org.swen90017.oas.entity.SlotSession> sessions = slotSessionMapper.listSessionsByAssignment(assignmentId);
            if (sessions == null || sessions.isEmpty()) {
                throw new BusinessException(BusinessError.SCHEDULE_NOT_READY);
            }
            for (org.swen90017.oas.entity.SlotSession s : sessions) {
                if (Boolean.TRUE.equals(s.getIsPublishedToExaminer())) continue;
                s.setIsPublishedToExaminer(true);
                s.setUpdatedAt(releasedAt);
                slotSessionMapper.updateById(s);
            }
        } else if ("students".equals(audience)) {
            // 发布给学生：要求所有会话 fully staffed
            List<org.swen90017.oas.entity.SlotSession> sessions = slotSessionMapper.listSessionsByAssignment(assignmentId);
            if (sessions == null || sessions.isEmpty()) {
                throw new BusinessException(BusinessError.SCHEDULE_NOT_READY);
            }
            java.util.List<Long> uncovered = new java.util.ArrayList<>();
            for (org.swen90017.oas.entity.SlotSession s : sessions) {
                int required = s.getRequiredExaminers() == null ? 0 : s.getRequiredExaminers();
                int current = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId()).size();
                if (required <= 0 || current < required) {
                    uncovered.add(s.getSessionId());
                }
            }
            if (!uncovered.isEmpty()) {
                throw new BusinessException(BusinessError.STAFFING_INCOMPLETE);
            }
            for (org.swen90017.oas.entity.SlotSession s : sessions) {
                if (Boolean.TRUE.equals(s.getIsPublishedToStudent())) continue;
                s.setIsPublishedToStudent(true);
                s.setUpdatedAt(releasedAt);
                slotSessionMapper.updateById(s);
            }
        } else {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }

        // Build notifications by counting participants who joined
        ReleaseScheduleResponseDTO.NotificationsSentDTO notifications = new ReleaseScheduleResponseDTO.NotificationsSentDTO();
        int studentCount = assignmentParticipantMapper.countParticipantsByRoleAndJoin(assignmentId, 3L);
        int examinerCount = assignmentParticipantMapper.countParticipantsByRoleAndJoin(assignmentId, 2L);
        notifications.setStudents(studentCount);
        notifications.setExaminers(examinerCount);

        ReleaseScheduleResponseDTO response = new ReleaseScheduleResponseDTO();
        response.setReleasedAt(releasedAt);
        response.setNotificationsSent(notifications);
        response.setMessage("Schedule released successfully to " + audience);
        
        return response;
    }

    @Override
    public Boolean isReadyForRelease(Long assignmentId) {
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignment(assignmentId);
        if (CollectionUtils.isEmpty(sessions)) {
            return false; // No time slots defined
        }

        // 新校验：任意会话无考官视为不可发布
        for (SlotSession s : sessions) {
            List<Long> examinerIds = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            if (examinerIds == null || examinerIds.isEmpty()) {
                return false; // 存在未配员的 session
            }
        }

        return true; // All checks passed
    }

    @Override
    @Transactional
    public int updateExaminerSessionLimits(Long assignmentId, UpdateExaminerSessionLimitsRequestDTO request) {
        if (Boolean.TRUE.equals(assignmentMapper.isReleased(assignmentId))) {
            throw new BusinessException(CommonError.FORBIDDEN);
        }
        if (request == null || CollectionUtils.isEmpty(request.getExaminerLimits())) {
            throw new BusinessException(BusinessError.EXAMINER_LIMIT_INVALID);
        }
        int updated = 0;
        for (ExaminerSessionLimitDTO limit : request.getExaminerLimits()) {
            if (limit.getExaminerId() == null || limit.getMaxSessions() == null || limit.getMaxSessions() < 0) {
                throw new BusinessException(BusinessError.EXAMINER_LIMIT_INVALID);
            }
            // 先尝试更新；若更新行数为 0，则插入
            int rows = examinerAssignmentLimitMapper.updateMaxSessionsByPair(limit.getExaminerId(), assignmentId, limit.getMaxSessions());
            if (rows == 0) {
                ExaminerAssignmentLimit record = new ExaminerAssignmentLimit();
                record.setExaminerId(limit.getExaminerId());
                record.setAssignmentId(assignmentId);
                record.setMaxSessions(limit.getMaxSessions());
                examinerAssignmentLimitMapper.insert(record);
                rows = 1;
            }
            updated += rows;
        }
        return updated;
    }

    /**
     * Analyze schedule and identify issues
     */
    private ScheduleStatusResponseDTO.ScheduleSummaryDTO analyzeSessions(List<SlotSession> sessions, List<String> issues) {
        ScheduleStatusResponseDTO.ScheduleSummaryDTO summary = new ScheduleStatusResponseDTO.ScheduleSummaryDTO();
        if (CollectionUtils.isEmpty(sessions)) {
            issues.add("No sessions defined");
            summary.setTotalSessions(0);
            summary.setFullyStaffedSlots(0);
            summary.setUnstaffedSlots(0);
            summary.setTotalExaminers(0);
            return summary;
        }

        int totalSessions = sessions.size();
        int unstaffed = 0;

        for (SlotSession s : sessions) {
            List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            if (examiners == null || examiners.isEmpty()) {
                unstaffed++;
            }
        }

        summary.setTotalSessions(totalSessions);
        summary.setFullyStaffedSlots(totalSessions - unstaffed);
        summary.setUnstaffedSlots(unstaffed);
        summary.setTotalExaminers(null);
        return summary;
    }

    /**
     * Send notifications (mock implementation)
     */
    private ReleaseScheduleResponseDTO.NotificationsSentDTO sendNotifications(Long assignmentId, ReleaseScheduleRequestDTO request) {
        ReleaseScheduleResponseDTO.NotificationsSentDTO notifications = 
            new ReleaseScheduleResponseDTO.NotificationsSentDTO();
        
        // Mock notification counts
        // In real implementation, would query for students and examiners and send emails
        notifications.setStudents(request.getNotifyStudents() ? 45 : 0);
        notifications.setExaminers(request.getNotifyExaminers() ? 6 : 0);
        
        if (request.getNotifyStudents()) {
            log.info("Would send schedule release notification to students for assignment {}", assignmentId);
            // emailService.sendScheduleNotificationToStudents(assignmentId, request.getReleaseMessage());
        }
        
        if (request.getNotifyExaminers()) {
            log.info("Would send schedule release notification to examiners for assignment {}", assignmentId);
            // emailService.sendScheduleNotificationToExaminers(assignmentId, request.getReleaseMessage());
        }
        
        return notifications;
    }
}
