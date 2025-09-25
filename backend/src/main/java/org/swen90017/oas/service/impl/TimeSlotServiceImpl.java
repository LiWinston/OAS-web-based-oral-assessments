package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.dto.request.BatchCreateTimeSlotsRequestDTO;
import org.swen90017.oas.dto.request.DuplicateTimeSlotRequestDTO;
import org.swen90017.oas.dto.request.TimeSlotQueryRequestDTO;
import org.swen90017.oas.dto.request.TimeSlotRequestDTO;
import org.swen90017.oas.dto.request.CreateSingleTimeSlotRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.enums.SlotStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.TimeSlotService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Objects;

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
    private final org.swen90017.oas.mapper.SessionExaminerMapper sessionExaminerMapper;
    private final AssignmentMapper assignmentMapper;
    private final SysUserMapper sysUserMapper;
    private final ExaminerAssignmentLimitMapper examinerAssignmentLimitMapper;
    private final VenueMapper venueMapper;

    @Override
    public GetTimeSlotsResponseDTO getTimeSlots(Long assignmentId, String status) {
        return getTimeSlots(assignmentId, status, null, null);
    }

    @Override
    public GetTimeSlotsResponseDTO getTimeSlots(Long assignmentId, String status,
                                                LocalDateTime startAt, LocalDateTime endAt) {
        // Normalize null/empty at service layer
        // Assignment must exist
        Assignment assign = assignmentMapper.selectById(assignmentId);
        if (assign == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        List<TimeSlot> timeSlots = timeSlotMapper.selectByFilters(assignmentId, status, startAt, endAt);
        List<TimeSlotDetailDTO> timeSlotDTOs = timeSlots.stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());

        GetTimeSlotsResponseDTO.TimeSlotsSummaryDTO summary = calculateSummary(timeSlots);
        GetTimeSlotsResponseDTO response = new GetTimeSlotsResponseDTO();
        response.setTimeSlots(timeSlotDTOs);
        response.setSummary(summary);
        return response;
    }

    @Override
    public GetTimeSlotsResponseDTO getTimeSlots(Long assignmentId, TimeSlotQueryRequestDTO query) {
        LocalDate dateFilter = null; // single-date filter removed; use dateFrom/dateTo instead
        LocalDate start = (query != null && query.getDateFrom() != null && !query.getDateFrom().isEmpty())
                ? LocalDate.parse(query.getDateFrom()) : null;
        LocalDate end = (query != null && query.getDateTo() != null && !query.getDateTo().isEmpty())
                ? LocalDate.parse(query.getDateTo()) : null;
        String status = (query != null) ? query.getStatus() : null;
        // Pass dateFrom/dateTo through to mapper's startAt/endAt parameters (reuse signature, but filter by slot_date)

        return getTimeSlots(assignmentId, status,
                start != null ? start.atStartOfDay() : null,
                end != null ? end.atTime(23,59,59):null);
    }

    @Override
    public CalendarResponseDTO getCalendarData(Long assignmentId, YearMonth month) {

        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();

        List<TimeSlot> timeSlots = timeSlotMapper.selectByMonth(assignmentId, startDate, endDate);

        Map<String, CalendarResponseDTO.DateInfoDTO> result = new LinkedHashMap<>();

        // Aggregate by day; dynamically evaluate status via requiredExaminers and currentExaminers, and count each category
        for (TimeSlot slot : timeSlots) {
            String dateKey = slot.getSlotDate().toString();
            CalendarResponseDTO.DateInfoDTO dateInfo = result.get(dateKey);
            if (dateInfo == null) {
                dateInfo = new CalendarResponseDTO.DateInfoDTO();
                dateInfo.setTimeSlots(0);
                dateInfo.setSessions(0);
                dateInfo.setFullyStaffed(0);
                dateInfo.setPartialStaffed(0);
                dateInfo.setNoStaffed(0);
                dateInfo.setBookableSessions(0);
                dateInfo.setFullSessions(0);
                dateInfo.setUnstaffedSessions(0);
                result.put(dateKey, dateInfo);
            }

            // Accumulate slots and sessions for the day
            dateInfo.setTimeSlots(dateInfo.getTimeSlots() + 1);
            dateInfo.setSessions(dateInfo.getSessions() + (slot.getSessionCount() == null ? 0 : slot.getSessionCount()));

            // Dynamic status calculation based on requiredExaminers and currentExaminers
            int required = slot.getRequiredExaminers() == null ? 0 : slot.getRequiredExaminers();
            int current = slot.getCurrentExaminers() == null ? 0 : slot.getCurrentExaminers();
            boolean isFull = required > 0 && current >= required;
            boolean isHalfOrMore = required > 0 && current > 0 && current * 2 >= required; // >=50%
            if (isFull) {
                dateInfo.setFullyStaffed(dateInfo.getFullyStaffed() + 1);
            } else if (isHalfOrMore) {
                dateInfo.setPartialStaffed(dateInfo.getPartialStaffed() + 1);
            } else if (current == 0) {
                // Keep/set to empty
                dateInfo.setNoStaffed(dateInfo.getNoStaffed() + 1);
            }
        }

        // Additionally: session-level aggregation (independent of time slots). Query sessions within the monthly window and count bookable/full/unstaffed
        LocalDateTime rangeStart = startDate.atStartOfDay();
        LocalDateTime rangeEnd = endDate.atTime(23,59,59);
        List<SlotSession> sessions = slotSessionMapper.listSessionsByAssignmentAndRange(assignmentId, rangeStart, rangeEnd);
        for (SlotSession s : sessions) {
            String key = s.getStartAt().toLocalDate().toString();
            CalendarResponseDTO.DateInfoDTO dateInfo = result.get(key);
            if (dateInfo == null) {
                dateInfo = new CalendarResponseDTO.DateInfoDTO();
                dateInfo.setTimeSlots(0);
                dateInfo.setSessions(0);
                dateInfo.setFullyStaffed(0);
                dateInfo.setPartialStaffed(0);
                dateInfo.setNoStaffed(0);
                dateInfo.setBookableSessions(0);
                dateInfo.setFullSessions(0);
                dateInfo.setUnstaffedSessions(0);
                result.put(key, dateInfo);
            }
            // Compute session-level tri-state
            boolean published = s.getIsPublishedToStudent() == null ? true : s.getIsPublishedToStudent();
            List<Long> examiners = sessionExaminerMapper.listExaminerIdsBySession(s.getSessionId());
            boolean staffed = examiners != null && !examiners.isEmpty();
            boolean full;
            if (s.getCapacityGroups() != null && s.getCapacityGroups() > 0) {
                int enrolled = s.getEnrolledGroups() == null ? 0 : s.getEnrolledGroups();
                full = enrolled >= s.getCapacityGroups();
            } else {
                full = s.getStatus() == org.swen90017.oas.enums.SessionStatus.BOOKED || s.getStatus() == org.swen90017.oas.enums.SessionStatus.BLOCKED;
            }
            boolean available = published && staffed && !full && s.getStatus() == org.swen90017.oas.enums.SessionStatus.AVAILABLE;
            if (!staffed) {
                dateInfo.setUnstaffedSessions(dateInfo.getUnstaffedSessions() + 1);
            } else if (full) {
                dateInfo.setFullSessions(dateInfo.getFullSessions() + 1);
            } else if (available) {
                dateInfo.setBookableSessions(dateInfo.getBookableSessions() + 1);
            }
        }

        CalendarResponseDTO dto = new CalendarResponseDTO();
        dto.setMonth(month.toString());
        dto.setDates(result);
        return dto;
    }

    @Override
    @Transactional
    public BatchCreateTimeSlotsResponseDTO batchCreateTimeSlots(Long assignmentId, BatchCreateTimeSlotsRequestDTO request) {
        ensureAssignmentNotReleased(assignmentId);
        // Get session configuration
        AssignmentSessionConfig config = sessionConfigMapper.selectById(assignmentId);
        if (config == null || !config.getIsConfigured()) {
            throw new BusinessException(BusinessError.SESSION_CONFIG_NOT_FOUND);
        }

        // 1) The assignment must have at least one venue
        List<Venue> venuesOfAssignment = venueMapper.listByAssignmentId(assignmentId);
        if (venuesOfAssignment == null || venuesOfAssignment.isEmpty()) {
            throw new BusinessException(BusinessError.ASSIGNMENT_HAS_NO_VENUE);
        }

        // 2) If the assignment already has any time slots, delete all and replace with this request
        List<TimeSlot> existing = timeSlotMapper.listByAssignment(assignmentId);
        if (existing != null && !existing.isEmpty()) {
            List<Long> toDeleteIds = new ArrayList<>();
            for (TimeSlot ts : existing) {
                toDeleteIds.add(ts.getSlotId());
            }
            deleteTimeSlots(assignmentId, toDeleteIds);
        }

        List<TimeSlotDetailDTO> createdTimeSlots = new ArrayList<>();
        int totalSessionsGenerated = 0;
        
        for (TimeSlotRequestDTO timeSlotRequest : request.getTimeSlots()) {
            try {
                // 3) Validate that the provided venueId exists and belongs to the assignment
                Venue v = venueMapper.selectById(timeSlotRequest.getVenueId());
                if (v == null) {
                    throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
                }
                if (!Objects.equals(v.getAssignmentId(), assignmentId)) {
                    throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
                }

                // 4) Validate venue overlap
                LocalDateTime startAt = timeSlotRequest.getDate().atTime(timeSlotRequest.getStartTime());
                LocalDateTime endAt = timeSlotRequest.getDate().atTime(timeSlotRequest.getEndTime());
                
                int overlapCount = timeSlotMapper.countVenueOverlap(
                    assignmentId, timeSlotRequest.getVenueId(), startAt, endAt, null);
                
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
    public UpdateTimeSlotResponseDTO updateTimeSlot(Long timeSlotId, TimeSlotRequestDTO request) {
        TimeSlot existingSlot = timeSlotMapper.selectById(timeSlotId);
        if (existingSlot == null) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }
        ensureAssignmentNotReleased(existingSlot.getAssignmentId());

        // 1) Validate venueId exists and belongs to the assignment
        Venue v = venueMapper.selectById(request.getVenueId());
        if (v == null) {
            throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
        }
        if (!Objects.equals(v.getAssignmentId(), existingSlot.getAssignmentId())) {
            throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
        }

        // 2) Update time slot
        LocalDateTime startAt = request.getDate().atTime(request.getStartTime());
        LocalDateTime endAt = request.getDate().atTime(request.getEndTime());
        
        // 3) Check venue overlap (excluding current slot)
        int overlapCount = timeSlotMapper.countVenueOverlap(
            existingSlot.getAssignmentId(), request.getVenueId(), startAt, endAt, timeSlotId);
        
        if (overlapCount > 0) {
            throw new BusinessException(BusinessError.VENUE_OVERLAP);
        }

        existingSlot.setSlotDate(request.getDate());
        existingSlot.setStartAt(startAt);
        existingSlot.setEndAt(endAt);
        existingSlot.setVenueId(request.getVenueId());
        existingSlot.setSessionCount(request.getSessionCount());
        existingSlot.setUpdatedAt(LocalDateTime.now());
        if (request.getRequiredExaminers() != null && request.getRequiredExaminers() >= 0) {
            existingSlot.setRequiredExaminers(request.getRequiredExaminers());
        }
        
        timeSlotMapper.updateById(existingSlot);

        // Delete all old sessions of this slot and record the deleted sessions for the response
        List<SlotSession> oldSessions = slotSessionMapper.findBySlotId(timeSlotId);
        List<SessionDetailDTO> deleted = new ArrayList<>();
        if (!CollectionUtils.isEmpty(oldSessions)) {
            for (SlotSession s : oldSessions) {
                deleted.add(convertSessionToDTO(s));
            }
            slotSessionMapper.deleteBySlotId(timeSlotId);
        }

        // Regenerate sessions according to the requested sessionCount
        generateSessions(existingSlot, request.getSessionCount());

        // If assignExaminerIds are provided, perform replace-style assignment (clear existing then rebuild)
        if (request.getAssignExaminerIds() != null) {
            // Clear existing assignments
            timeSlotExaminersMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<TimeSlotExaminer>()
                    .eq("slot_id", timeSlotId));

            if (!request.getAssignExaminerIds().isEmpty()) {
                // Must not exceed the requiredExaminers limit
                Integer required = existingSlot.getRequiredExaminers();
                if (required != null && required > 0 && request.getAssignExaminerIds().size() > required) {
                    throw new BusinessException(BusinessError.EXCEEDS_REQUIRED_EXAMINERS);
                }

                java.util.Set<Long> unique = new java.util.HashSet<>(request.getAssignExaminerIds());
                java.util.List<TimeSlotExaminer> rows = new java.util.ArrayList<>();
                LocalDateTime now = LocalDateTime.now();
                for (Long examinerId : unique) {
                    TimeSlotExaminer e = new TimeSlotExaminer();
                    e.setSlotId(timeSlotId);
                    e.setExaminerId(examinerId);
                    e.setAssignedAt(now);
                    e.setAssignedBy(null);
                    rows.add(e);
                }
                if (!rows.isEmpty()) {
                    timeSlotExaminersMapper.batchInsert(rows);
                }
            }
        }

        // Finally, update counters and status based on the latest data (covers cases like only modifying requiredExaminers)
        java.util.List<Long> assignedIds = timeSlotExaminersMapper.listExaminerIdsBySlot(timeSlotId);
        int currentExaminers = assignedIds == null ? 0 : assignedIds.size();
        int booked = slotSessionMapper.countBookedBySlot(timeSlotId);
        timeSlotMapper.updateCountersAndStatus(timeSlotId, currentExaminers, booked);

        UpdateTimeSlotResponseDTO response = new UpdateTimeSlotResponseDTO();
        // Return the latest data to avoid inconsistencies (e.g., status) caused by stale in-memory objects
        TimeSlot latest = timeSlotMapper.selectById(timeSlotId);
        response.setTimeSlot(convertToDetailDTO(latest));
        response.setDeletedSessions(deleted);
        response.setDeletedCount(deleted.size());
        return response;
    }

    @Override
    @Transactional
    public TimeSlotDetailDTO duplicateTimeSlot(Long assignmentId, Long timeSlotId, DuplicateTimeSlotRequestDTO request) {
        TimeSlot sourceSlot = timeSlotMapper.selectById(timeSlotId);
        if (sourceSlot == null) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }
        
        // Validate that the time slot belongs to the specified assignment
        if (!sourceSlot.getAssignmentId().equals(assignmentId)) {
            throw new BusinessException("Time slot does not belong to the specified assignment", CommonError.BAD_REQUEST.getCode());
        }
        
        ensureAssignmentNotReleased(sourceSlot.getAssignmentId());

        // Create new time slot based on source
        TimeSlotRequestDTO newSlotRequest = new TimeSlotRequestDTO();
        newSlotRequest.setDate(request.getDate() != null ? request.getDate() : sourceSlot.getSlotDate());
        newSlotRequest.setStartTime(request.getStartTime() != null ? request.getStartTime() : sourceSlot.getStartAt().toLocalTime());
        newSlotRequest.setEndTime(calculateEndTime(newSlotRequest.getStartTime(), sourceSlot.getStartAt(), sourceSlot.getEndAt()));
        newSlotRequest.setSessionCount(sourceSlot.getSessionCount());
        newSlotRequest.setVenueId(sourceSlot.getVenueId());

        // Get configuration and create new slot
        AssignmentSessionConfig config = sessionConfigMapper.selectById(sourceSlot.getAssignmentId());
        TimeSlot newSlot = createTimeSlot(sourceSlot.getAssignmentId(), newSlotRequest, config);
        
        // Generate sessions
        generateSessions(newSlot, newSlotRequest.getSessionCount());
        
        // Copy examiners if not clearing
        if (request.getClearExaminers() == null || !request.getClearExaminers()) {
            // Check examiner session limits before copying
            validateExaminerSessionLimits(timeSlotId, sourceSlot.getAssignmentId(), sourceSlot.getSessionCount());
            copyExaminers(timeSlotId, newSlot.getSlotId());
        }
        
        return convertToDetailDTO(newSlot);
    }

    @Override
    @Transactional
    public List<Long> deleteTimeSlots(Long assignmentId, List<Long> timeSlotIds) {
        ensureAssignmentNotReleased(assignmentId);
        
        // Verify all time slots exist and belong to the assignment
        for (Long timeSlotId : timeSlotIds) {
            TimeSlot timeSlot = timeSlotMapper.selectById(timeSlotId);
            if (timeSlot == null) {
                throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
            }
            if (!timeSlot.getAssignmentId().equals(assignmentId)) {
                throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
            }
        }
        
        // Delete sessions first
        List<Long> deleted = new ArrayList<>();
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
            int rows = timeSlotMapper.deleteById(timeSlotId);
            if (rows > 0) {
                deleted.add(timeSlotId);
            }
        }
        return deleted;
        
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
        
        // Write back the actual generated session count to the slot and persist it, ensuring DB value is min(requested, maximum possible)
        timeSlot.setSessionCount(actualSessionCount);
        timeSlotMapper.updateById(timeSlot);

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

    @Override
    @Transactional
    public TimeSlotDetailDTO createSingleTimeSlot(Long assignmentId, CreateSingleTimeSlotRequestDTO request) {
        ensureAssignmentNotReleased(assignmentId);

        // Validate session config
        AssignmentSessionConfig config = sessionConfigMapper.selectById(assignmentId);
        if (config == null || !config.getIsConfigured()) {
            throw new BusinessException(BusinessError.SESSION_CONFIG_NOT_FOUND);
        }

        // Validate venue exists and belongs to assignment
        Venue v = venueMapper.selectById(request.getVenueId());
        if (v == null) {
            throw new BusinessException(BusinessError.VENUE_NOT_FOUND);
        }
        if (!Objects.equals(v.getAssignmentId(), assignmentId)) {
            throw new BusinessException(BusinessError.VENUE_NOT_IN_ASSIGNMENT);
        }

        // Overlap check
        LocalDateTime startAt = request.getDate().atTime(request.getStartTime());
        // End time: sessionCount updates and session generation are handled by generateSessions; here we only estimate the time window for overlap detection using request's date+start/end
        // Estimate endAt using sessionLength+gap: sessionCount * (sessionLength + gap) - gap
        int sessionLengthMin = config.getSessionLengthMin();
        int gapTimeMin = config.getGapTimeMin();
        int blocks = Math.max(1, request.getSessionCount());
        long totalWindow = (long) blocks * (sessionLengthMin + gapTimeMin) - gapTimeMin;
        LocalDateTime endAt = startAt.plusMinutes(Math.max(totalWindow, sessionLengthMin));

        int overlap = timeSlotMapper.countVenueOverlap(assignmentId, request.getVenueId(), startAt, endAt, null);
        if (overlap > 0) {
            throw new BusinessException(BusinessError.VENUE_OVERLAP);
        }

        // Build TimeSlotRequestDTO to reuse creator
        TimeSlotRequestDTO tsReq = new TimeSlotRequestDTO();
        tsReq.setDate(request.getDate());
        tsReq.setStartTime(request.getStartTime());
        tsReq.setEndTime(endAt.toLocalTime());
        tsReq.setSessionCount(request.getSessionCount());
        tsReq.setVenueId(request.getVenueId());

        // Create slot
        TimeSlot slot = createTimeSlot(assignmentId, tsReq, config);

        // Override requiredExaminers if provided
        if (request.getRequiredExaminers() != null) {
            slot.setRequiredExaminers(request.getRequiredExaminers());
            timeSlotMapper.updateById(slot);
        }

        // Generate sessions
        generateSessions(slot, request.getSessionCount());

        // Optionally assign examiners
        if (request.getAssignExaminerIds() != null && !request.getAssignExaminerIds().isEmpty()) {
            List<TimeSlotExaminer> rows = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();
            for (Long examinerId : new java.util.HashSet<>(request.getAssignExaminerIds())) {
                TimeSlotExaminer e = new TimeSlotExaminer();
                e.setSlotId(slot.getSlotId());
                e.setExaminerId(examinerId);
                e.setAssignedAt(now);
                e.setAssignedBy(null);
                rows.add(e);
            }
            if (!rows.isEmpty()) {
                timeSlotExaminersMapper.batchInsert(rows);
            }
            // Update counters and status
            List<Long> assignedIds = timeSlotExaminersMapper.listExaminerIdsBySlot(slot.getSlotId());
            int currentExaminers = assignedIds == null ? 0 : assignedIds.size();
            int booked = slot.getBookedSessions() == null ? 0 : slot.getBookedSessions();
            timeSlotMapper.updateCountersAndStatus(slot.getSlotId(), currentExaminers, booked);
        }

        // Return detail
        TimeSlot refreshed = timeSlotMapper.selectById(slot.getSlotId());
        return convertToDetailDTO(refreshed);
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
        timeSlot.setVenueId(request.getVenueId());
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
        dto.setVenueId(timeSlot.getVenueId());
        // Populate venue name
        try {
            Venue v = venueMapper.selectById(timeSlot.getVenueId());
            if (v != null) {
                dto.setVenueName(v.getRoomName());
            }
        } catch (Exception ignored) {}
        dto.setRequiredExaminers(timeSlot.getRequiredExaminers());
        dto.setSessionCount(timeSlot.getSessionCount());
        dto.setStatus(timeSlot.getStatus());
        dto.setBookedSessions(timeSlot.getBookedSessions());
        dto.setCreatedAt(timeSlot.getCreatedAt());
        dto.setLastModified(timeSlot.getUpdatedAt());
        
        // Load sessions
        List<SlotSession> sessions = slotSessionMapper.findBySlotId(timeSlot.getSlotId());
        dto.setSessions(sessions.stream().map(this::convertSessionToDTO).collect(Collectors.toList()));
        
        // Load assigned examiners with user info
        List<Long> examinerIds = timeSlotExaminersMapper.listExaminerIdsBySlot(timeSlot.getSlotId());
        List<ExaminerDetailDTO> assignedExaminers = new ArrayList<>();
        if (examinerIds != null && !examinerIds.isEmpty()) {
            List<SysUser> users = sysUserMapper.selectBatchIds(examinerIds);
            for (SysUser user : users) {
                ExaminerDetailDTO examinerDTO = new ExaminerDetailDTO();
                examinerDTO.setId(user.getUserId());
                examinerDTO.setName(user.getUserName());
                examinerDTO.setEmail(user.getEmail());
                assignedExaminers.add(examinerDTO);
            }
        }
        dto.setAssignedExaminers(assignedExaminers);
        
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
     * Guard: block any time slot modifications when assignment is released
     */
    private void ensureAssignmentNotReleased(Long assignmentId) {
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }
        
        Boolean released = assignmentMapper.isReleased(assignmentId);
        if (Boolean.TRUE.equals(released)) {
            throw new BusinessException(BusinessError.ASSIGNMENT_RELEASED_IMMUTABLE);
        }
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
        // Get all examiner IDs assigned to the source slot
        List<Long> examinerIds = timeSlotExaminersMapper.listExaminerIdsBySlot(sourceSlotId);
        
        if (examinerIds == null || examinerIds.isEmpty()) {
            log.debug("No examiners to copy from slot {}", sourceSlotId);
            return;
        }
        
        // Create examiner assignments for the new slot
        List<TimeSlotExaminer> newAssignments = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        // TODO: Get current operator ID from security context
        Long operatorId = null; 
        
        for (Long examinerId : examinerIds) {
            TimeSlotExaminer assignment = new TimeSlotExaminer();
            assignment.setSlotId(newSlotId);
            assignment.setExaminerId(examinerId);
            assignment.setAssignedAt(now);
            assignment.setAssignedBy(operatorId);
            newAssignments.add(assignment);
        }
        
        // Batch insert the new examiner assignments
        if (!newAssignments.isEmpty()) {
            timeSlotExaminersMapper.batchInsert(newAssignments);
            log.info("Copied {} examiner assignments from slot {} to slot {}", 
                newAssignments.size(), sourceSlotId, newSlotId);
        }
        
        // Update the new slot's examiner count and status
        TimeSlot newSlot = timeSlotMapper.selectById(newSlotId);
        if (newSlot != null) {
            int currentExaminers = examinerIds.size();
            int bookedSessions = newSlot.getBookedSessions() == null ? 0 : newSlot.getBookedSessions();
            timeSlotMapper.updateCountersAndStatus(newSlotId, currentExaminers, bookedSessions);
            
            log.debug("Updated slot {} counters: {} examiners, {} booked sessions", 
                newSlotId, currentExaminers, bookedSessions);
        }
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

    /**
     * Validate examiner session limits before copying examiners to a new time slot
     */
    private void validateExaminerSessionLimits(Long sourceSlotId, Long assignmentId, Integer sessionCount) {
        // Get all examiner IDs assigned to the source slot
        List<Long> examinerIds = timeSlotExaminersMapper.listExaminerIdsBySlot(sourceSlotId);
        
        if (examinerIds == null || examinerIds.isEmpty()) {
            return; // No examiners to validate
        }

        // Get assignment session config for default limits
        AssignmentSessionConfig config = sessionConfigMapper.selectById(assignmentId);
        int defaultMaxSessions = (config == null || config.getDefaultMaxSessionsPerExaminer() == null) 
            ? 0 : config.getDefaultMaxSessionsPerExaminer();

        // Check each examiner's session limits
        for (Long examinerId : examinerIds) {
            // Get examiner's max sessions limit (personalized or default)
            ExaminerAssignmentLimit personalLimit = examinerAssignmentLimitMapper.findByExaminerAndAssignment(examinerId, assignmentId);
            int maxSessions = (personalLimit != null && personalLimit.getMaxSessions() != null) 
                ? personalLimit.getMaxSessions() : defaultMaxSessions;

            // Skip validation if unlimited (maxSessions = 0)
            if (maxSessions <= 0) {
                continue;
            }

            // Get examiner's current assigned sessions in this assignment (via session_examiners)
            int currentSessions = sessionExaminerMapper.countAssignedSessionsByExaminer(assignmentId, examinerId);
            
            // Check if copying this time slot would exceed the limit
            int newTotalSessions = currentSessions + (sessionCount == null ? 0 : sessionCount);
            if (newTotalSessions > maxSessions) {
                // Get examiner name for better error message
                SysUser examiner = sysUserMapper.selectById(examinerId);
                String examinerName = (examiner != null) ? examiner.getUserName() : "ID:" + examinerId;
                
                throw new BusinessException(
                    String.format("Cannot duplicate time slot: Examiner %s would exceed session limit. Current: %d, After duplication: %d, Max allowed: %d", 
                        examinerName, currentSessions, newTotalSessions, maxSessions),
                    CommonError.BAD_REQUEST.getCode()
                );
            }
        }
        
        log.debug("All examiners passed session limit validation for time slot duplication");
    }
}
