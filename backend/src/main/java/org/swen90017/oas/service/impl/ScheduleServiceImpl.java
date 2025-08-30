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
import org.swen90017.oas.entity.TimeSlot;
import org.swen90017.oas.enums.SlotStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentSessionConfigMapper;
import org.swen90017.oas.mapper.TimeSlotMapper;
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
    private final TimeSlotMapper timeSlotMapper;
    private final AssignmentSessionConfigMapper assignmentSessionConfigMapper;
    private final EmailService emailService;

    @Override
    public ScheduleStatusResponseDTO getScheduleStatus(Long assignmentId) {
        // Check if assignment exists
        String currentStatus = assignmentMapper.getScheduleStatus(assignmentId);
        if (currentStatus == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        Boolean isReleased = assignmentMapper.isReleased(assignmentId);
        
        // Get time slots for analysis
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, null, null);
        
        // Analyze schedule readiness
        List<String> issues = new ArrayList<>();
        ScheduleStatusResponseDTO.ScheduleSummaryDTO summary = analyzeSchedule(timeSlots, issues);
        
        ScheduleStatusResponseDTO response = new ScheduleStatusResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setScheduleStatus(isReleased ? "released" : "draft");
        response.setIsReleased(isReleased);
        response.setTotalTimeSlots(timeSlots.size());
        response.setReadyForRelease(issues.isEmpty());
        response.setIssues(issues);
        response.setSummary(summary);
        
        return response;
    }

    @Override
    @Transactional
    public ReleaseScheduleResponseDTO releaseSchedule(Long assignmentId, ReleaseScheduleRequestDTO request) {
        // Verify schedule is ready for release
        if (!isReadyForRelease(assignmentId)) {
            throw new BusinessException(BusinessError.SCHEDULE_NOT_READY);
        }

        // Update assignment release status
        LocalDateTime releasedAt = LocalDateTime.now();
        int updated = assignmentMapper.updateRelease(assignmentId, "released", true, releasedAt);
        
        if (updated == 0) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // Enable booking for all time slots
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, null, null);
        for (TimeSlot slot : timeSlots) {
            slot.setBookingOpen(true);
            timeSlotMapper.updateById(slot);
        }

        // Send notifications (mock implementation)
        ReleaseScheduleResponseDTO.NotificationsSentDTO notifications = sendNotifications(
            assignmentId, request);

        ReleaseScheduleResponseDTO response = new ReleaseScheduleResponseDTO();
        response.setReleasedAt(releasedAt);
        response.setNotificationsSent(notifications);
        response.setMessage("Schedule released successfully");
        
        return response;
    }

    @Override
    public Boolean isReadyForRelease(Long assignmentId) {
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, null, null);
        
        if (CollectionUtils.isEmpty(timeSlots)) {
            return false; // No time slots defined
        }

        // Check if all slots have required examiners
        for (TimeSlot slot : timeSlots) {
            if (slot.getCurrentExaminers() < slot.getRequiredExaminers()) {
                return false; // Understaffed slot found
            }
        }

        return true; // All checks passed
    }

    @Override
    @Transactional
    public void updateExaminerSessionLimits(Long assignmentId, UpdateExaminerSessionLimitsRequestDTO request) {
        // TODO: Persist per-examiner limits when the storage schema is available.
        // For now, this is a no-op placeholder to keep compilation and endpoint behavior consistent.
        if (request == null || CollectionUtils.isEmpty(request.getExaminerLimits())) {
            throw new BusinessException(CommonError.INVALID_PARAMS);
        }
        for (ExaminerSessionLimitDTO limit : request.getExaminerLimits()) {
            if (limit.getExaminerId() == null || limit.getMaxSessions() == null) {
                throw new BusinessException(CommonError.INVALID_PARAMS);
            }


        }
    }

    /**
     * Analyze schedule and identify issues
     */
    private ScheduleStatusResponseDTO.ScheduleSummaryDTO analyzeSchedule(List<TimeSlot> timeSlots, List<String> issues) {
        ScheduleStatusResponseDTO.ScheduleSummaryDTO summary = new ScheduleStatusResponseDTO.ScheduleSummaryDTO();
        
        if (CollectionUtils.isEmpty(timeSlots)) {
            issues.add("No time slots defined");
            summary.setTotalSessions(0);
            summary.setFullyStaffedSlots(0);
            summary.setUnstaffedSlots(0);
            summary.setTotalExaminers(0);
            return summary;
        }

        int totalSessions = 0;
        int fullyStaffed = 0;
        int unstaffed = 0;
        int totalExaminers = 0;

        for (TimeSlot slot : timeSlots) {
            totalSessions += slot.getSessionCount();
            
            if (slot.getStatus() == SlotStatus.FULL) {
                fullyStaffed++;
            } else if (slot.getStatus() == SlotStatus.EMPTY) {
                unstaffed++;
                issues.add(String.format("Time slot %d has no assigned examiners", slot.getSlotId()));
            } else if (slot.getCurrentExaminers() < slot.getRequiredExaminers()) {
                issues.add(String.format("Time slot %d needs %d more examiner(s)", 
                    slot.getSlotId(), slot.getRequiredExaminers() - slot.getCurrentExaminers()));
            }
            
            totalExaminers += slot.getCurrentExaminers();
        }

        summary.setTotalSessions(totalSessions);
        summary.setFullyStaffedSlots(fullyStaffed);
        summary.setUnstaffedSlots(unstaffed);
        summary.setTotalExaminers(totalExaminers);

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
