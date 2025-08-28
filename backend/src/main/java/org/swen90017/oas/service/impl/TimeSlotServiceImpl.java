package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.BatchCreateTimeSlotsRequestDTO;
import org.swen90017.oas.dto.request.DuplicateTimeSlotRequestDTO;
import org.swen90017.oas.dto.request.TimeSlotRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.AssignmentSessionConfig;
import org.swen90017.oas.entity.SlotSession;
import org.swen90017.oas.entity.TimeSlot;
import org.swen90017.oas.entity.TimeSlotExaminer;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.enums.SlotStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentSessionConfigMapper;
import org.swen90017.oas.mapper.SlotSessionMapper;
import org.swen90017.oas.mapper.TimeSlotExaminersMapper;
import org.swen90017.oas.mapper.TimeSlotMapper;
import org.swen90017.oas.service.TimeSlotService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Time Slot Service Implementation
 * Implements operations for managing time slots and sessions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimeSlotServiceImpl extends ServiceImpl<TimeSlotMapper, TimeSlot> implements TimeSlotService {

    private final TimeSlotMapper timeSlotMapper;
    private final SlotSessionMapper slotSessionMapper;
    private final AssignmentSessionConfigMapper sessionConfigMapper;
    private final TimeSlotExaminersMapper timeSlotExaminersMapper;

    @Override
    public GetTimeSlotsResponseDTO getTimeSlots(Long assignmentId, LocalDate date, String status) {
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, date, status);
        List<TimeSlotDetailDTO> timeSlotDTOs = timeSlots.stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());

        // Calculate summary
        GetTimeSlotsResponseDTO.TimeSlotsSummaryDTO summary = calculateSummary(timeSlots);

        GetTimeSlotsResponseDTO response = new GetTimeSlotsResponseDTO();
        response.setTimeSlots(timeSlotDTOs);
        response.setSummary(summary);
        
        return response;
    }

    @Override
    @Transactional
    public BatchCreateTimeSlotsResponseDTO batchCreateTimeSlots(Long assignmentId, BatchCreateTimeSlotsRequestDTO request) {
        // Get session configuration
        AssignmentSessionConfig config = sessionConfigMapper.selectById(assignmentId);
        if (config == null || !config.getIsConfigured()) {
            throw new BusinessException(BusinessError.SESSION_CONFIG_NOT_FOUND);
        }

        List<TimeSlotDetailDTO> createdTimeSlots = new ArrayList<>();
        int totalSessionsGenerated = 0;
        
        for (TimeSlotRequestDTO timeSlotRequest : request.getTimeSlots()) {
            try {
                // Validate venue overlap
                LocalDateTime startAt = timeSlotRequest.getDate().atTime(timeSlotRequest.getStartTime());
                LocalDateTime endAt = timeSlotRequest.getDate().atTime(timeSlotRequest.getEndTime());
                
                int overlapCount = timeSlotMapper.countVenueOverlap(
                    assignmentId, timeSlotRequest.getVenue(), startAt, endAt, null);
                
                if (overlapCount > 0) {
                    log.warn("Venue overlap detected for slot at {} {}-{}, skipping", 
                        timeSlotRequest.getDate(), timeSlotRequest.getStartTime(), timeSlotRequest.getEndTime());
                    continue; // Skip this slot but continue with others
                }

                // Create time slot
                TimeSlot timeSlot = createTimeSlot(assignmentId, timeSlotRequest, config);
                
                // Generate sessions
                int sessionsGenerated = generateSessions(timeSlot, timeSlotRequest.getSessionCount());
                totalSessionsGenerated += sessionsGenerated;
                
                // Convert to DTO
                TimeSlotDetailDTO dto = convertToDetailDTO(timeSlot);
                createdTimeSlots.add(dto);
                
            } catch (Exception e) {
                log.error("Failed to create time slot: {}", e.getMessage());
                // Continue with other slots
            }
        }

        // Build response
        BatchCreateTimeSlotsResponseDTO response = new BatchCreateTimeSlotsResponseDTO();
        response.setTimeSlotsCreated(createdTimeSlots.size());
        response.setSessionsGenerated(totalSessionsGenerated);
        response.setTimeSlots(createdTimeSlots);
        response.setMessage(String.format("%d time slots created with %d sessions generated", 
            createdTimeSlots.size(), totalSessionsGenerated));
        
        return response;
    }

    @Override
    @Transactional
    public TimeSlotDetailDTO updateTimeSlot(Long timeSlotId, TimeSlotRequestDTO request) {
        TimeSlot existingSlot = timeSlotMapper.selectById(timeSlotId);
        if (existingSlot == null) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }

        // Update time slot
        LocalDateTime startAt = request.getDate().atTime(request.getStartTime());
        LocalDateTime endAt = request.getDate().atTime(request.getEndTime());
        
        // Check venue overlap (excluding current slot)
        int overlapCount = timeSlotMapper.countVenueOverlap(
            existingSlot.getAssignmentId(), request.getVenue(), startAt, endAt, timeSlotId);
        
        if (overlapCount > 0) {
            throw new BusinessException(BusinessError.VENUE_OVERLAP);
        }

        existingSlot.setSlotDate(request.getDate());
        existingSlot.setStartAt(startAt);
        existingSlot.setEndAt(endAt);
        existingSlot.setVenue(request.getVenue());
        existingSlot.setSessionCount(request.getSessionCount());
        existingSlot.setUpdatedAt(LocalDateTime.now());
        
        timeSlotMapper.updateById(existingSlot);
        
        return convertToDetailDTO(existingSlot);
    }

    @Override
    @Transactional
    public TimeSlotDetailDTO duplicateTimeSlot(Long timeSlotId, DuplicateTimeSlotRequestDTO request) {
        TimeSlot sourceSlot = timeSlotMapper.selectById(timeSlotId);
        if (sourceSlot == null) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }

        // Create new time slot based on source
        TimeSlotRequestDTO newSlotRequest = new TimeSlotRequestDTO();
        newSlotRequest.setDate(request.getDate() != null ? request.getDate() : sourceSlot.getSlotDate());
        newSlotRequest.setStartTime(request.getStartTime() != null ? request.getStartTime() : sourceSlot.getStartAt().toLocalTime());
        newSlotRequest.setEndTime(calculateEndTime(newSlotRequest.getStartTime(), sourceSlot.getStartAt(), sourceSlot.getEndAt()));
        newSlotRequest.setSessionCount(sourceSlot.getSessionCount());
        newSlotRequest.setVenue(sourceSlot.getVenue());

        // Get configuration and create new slot
        AssignmentSessionConfig config = sessionConfigMapper.selectById(sourceSlot.getAssignmentId());
        TimeSlot newSlot = createTimeSlot(sourceSlot.getAssignmentId(), newSlotRequest, config);
        
        // Generate sessions
        generateSessions(newSlot, newSlotRequest.getSessionCount());
        
        // Copy examiners if not clearing
        if (request.getClearExaminers() == null || !request.getClearExaminers()) {
            copyExaminers(timeSlotId, newSlot.getSlotId());
        }
        
        return convertToDetailDTO(newSlot);
    }

    @Override
    @Transactional
    public void deleteTimeSlots(Long assignmentId, List<Long> timeSlotIds) {
        // Delete sessions first
        for (Long timeSlotId : timeSlotIds) {
            // Delete slot sessions
            List<SlotSession> sessions = slotSessionMapper.findBySlotId(timeSlotId);
            if (!CollectionUtils.isEmpty(sessions)) {
                sessions.forEach(session -> slotSessionMapper.deleteById(session.getSessionId()));
            }
            
            // Delete examiner assignments
            timeSlotExaminersMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<TimeSlotExaminer>()
                    .eq("slot_id", timeSlotId));
            
            // Delete time slot
            timeSlotMapper.deleteById(timeSlotId);
        }
    }

    @Override
    @Transactional
    public int generateSessions(TimeSlot timeSlot, Integer sessionCount) {
        AssignmentSessionConfig config = sessionConfigMapper.selectById(timeSlot.getAssignmentId());
        if (config == null) {
            return 0;
        }

        // Calculate session duration and gaps
        int sessionLengthMin = config.getSessionLengthMin();
        int gapTimeMin = config.getGapTimeMin();
        
        // Available time in minutes
        long totalMinutes = java.time.Duration.between(timeSlot.getStartAt(), timeSlot.getEndAt()).toMinutes();
        
        // Calculate maximum possible sessions
        long maxPossibleSessions = (totalMinutes + gapTimeMin) / (sessionLengthMin + gapTimeMin);
        
        // Use the smaller of requested count and maximum possible
        int actualSessionCount = (int) Math.min(sessionCount, maxPossibleSessions);
        
        if (actualSessionCount <= 0) {
            return 0;
        }

        // Generate sessions
        List<SlotSession> sessions = new ArrayList<>();
        LocalDateTime currentStart = timeSlot.getStartAt();
        
        for (int i = 1; i <= actualSessionCount; i++) {
            SlotSession session = new SlotSession();
            session.setSlotId(timeSlot.getSlotId());
            session.setSessionNumber(i);
            session.setStartAt(currentStart);
            session.setEndAt(currentStart.plusMinutes(sessionLengthMin));
            session.setStatus(SessionStatus.AVAILABLE);
            session.setCreatedAt(LocalDateTime.now());
            session.setUpdatedAt(LocalDateTime.now());
            
            sessions.add(session);
            
            // Move to next session start time
            currentStart = currentStart.plusMinutes(sessionLengthMin + gapTimeMin);
        }
        
        // Batch insert sessions
        if (!sessions.isEmpty()) {
            slotSessionMapper.batchInsert(sessions);
        }
        
        return actualSessionCount;
    }

    /**
     * Create a new time slot
     */
    private TimeSlot createTimeSlot(Long assignmentId, TimeSlotRequestDTO request, AssignmentSessionConfig config) {
        TimeSlot timeSlot = new TimeSlot();
        timeSlot.setAssignmentId(assignmentId);
        timeSlot.setSlotDate(request.getDate());
        timeSlot.setStartAt(request.getDate().atTime(request.getStartTime()));
        timeSlot.setEndAt(request.getDate().atTime(request.getEndTime()));
        timeSlot.setVenue(request.getVenue());
        timeSlot.setSessionCount(request.getSessionCount());
        timeSlot.setRequiredExaminers(config.getExaminersPerSession());
        timeSlot.setStatus(SlotStatus.EMPTY);
        timeSlot.setCurrentExaminers(0);
        timeSlot.setBookedSessions(0);
        timeSlot.setBookingOpen(false);
        timeSlot.setCreatedAt(LocalDateTime.now());
        timeSlot.setUpdatedAt(LocalDateTime.now());
        timeSlot.setVersion(1);
        
        timeSlotMapper.insert(timeSlot);
        return timeSlot;
    }

    /**
     * Convert entity to detail DTO
     */
    private TimeSlotDetailDTO convertToDetailDTO(TimeSlot timeSlot) {
        TimeSlotDetailDTO dto = new TimeSlotDetailDTO();
        dto.setId(timeSlot.getSlotId());
        dto.setDate(timeSlot.getSlotDate());
        dto.setStartTime(timeSlot.getStartAt().toLocalTime());
        dto.setEndTime(timeSlot.getEndAt().toLocalTime());
        dto.setVenue(timeSlot.getVenue());
        dto.setRequiredExaminers(timeSlot.getRequiredExaminers());
        dto.setSessionCount(timeSlot.getSessionCount());
        dto.setStatus(timeSlot.getStatus());
        dto.setBookedSessions(timeSlot.getBookedSessions());
        dto.setCreatedAt(timeSlot.getCreatedAt());
        dto.setLastModified(timeSlot.getUpdatedAt());
        
        // Load sessions
        List<SlotSession> sessions = slotSessionMapper.findBySlotId(timeSlot.getSlotId());
        dto.setSessions(sessions.stream().map(this::convertSessionToDTO).collect(Collectors.toList()));
        
        // Load assigned examiners (placeholder - would need examiner service)
        dto.setAssignedExaminers(new ArrayList<>());
        
        return dto;
    }

    /**
     * Convert session entity to DTO
     */
    private SessionDetailDTO convertSessionToDTO(SlotSession session) {
        SessionDetailDTO dto = new SessionDetailDTO();
        dto.setId(session.getSessionId());
        dto.setStartTime(session.getStartAt().toLocalTime());
        dto.setEndTime(session.getEndAt().toLocalTime());
        dto.setStatus(session.getStatus());
        dto.setSessionNumber(session.getSessionNumber());
        dto.setBookedBy(null); // Would need to lookup student/group info
        return dto;
    }

    /**
     * Calculate end time based on duration
     */
    private LocalTime calculateEndTime(LocalTime newStartTime, LocalDateTime originalStart, LocalDateTime originalEnd) {
        long durationMinutes = java.time.Duration.between(originalStart, originalEnd).toMinutes();
        return newStartTime.plusMinutes(durationMinutes);
    }

    /**
     * Copy examiners from source slot to new slot
     */
    private void copyExaminers(Long sourceSlotId, Long newSlotId) {
        List<Long> examinerIds = timeSlotExaminersMapper.listExaminerIdsBySlot(sourceSlotId);
        // Implementation would copy examiner assignments
        // This is a placeholder - actual implementation would use examiner service
    }

    /**
     * Calculate summary statistics for time slots
     */
    private GetTimeSlotsResponseDTO.TimeSlotsSummaryDTO calculateSummary(List<TimeSlot> timeSlots) {
        GetTimeSlotsResponseDTO.TimeSlotsSummaryDTO summary = new GetTimeSlotsResponseDTO.TimeSlotsSummaryDTO();
        
        if (CollectionUtils.isEmpty(timeSlots)) {
            summary.setTotalTimeSlots(0);
            summary.setTotalSessions(0);
            summary.setFullyStaffed(0);
            summary.setPartiallyStaffed(0);
            summary.setUnstaffed(0);
            return summary;
        }

        int totalSessions = 0;
        int fullyStaffed = 0;
        int partiallyStaffed = 0;
        int unstaffed = 0;

        for (TimeSlot slot : timeSlots) {
            totalSessions += slot.getSessionCount();
            
            if (slot.getCurrentExaminers() == 0) {
                unstaffed++;
            } else if (slot.getCurrentExaminers() >= slot.getRequiredExaminers()) {
                fullyStaffed++;
            } else {
                partiallyStaffed++;
            }
        }

        summary.setTotalTimeSlots(timeSlots.size());
        summary.setTotalSessions(totalSessions);
        summary.setFullyStaffed(fullyStaffed);
        summary.setPartiallyStaffed(partiallyStaffed);
        summary.setUnstaffed(unstaffed);

        return summary;
    }
}
