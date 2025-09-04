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
        // 将 dateFrom/dateTo 透传到 mapper 的 startAt/endAt 参数（复用签名，但用于按 slot_date 过滤）

        return getTimeSlots(assignmentId, status,
                start != null ? start.atStartOfDay() : null,
                end != null ? end.atTime(23,59,59):null);
    }

    @Override
    public Map<String, CalendarResponseDTO.DateInfoDTO> getCalendarData(Long assignmentId, YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();

        List<TimeSlot> timeSlots = timeSlotMapper.selectByMonth(assignmentId, startDate, endDate);

        Map<String, CalendarResponseDTO.DateInfoDTO> result = new LinkedHashMap<>();

        // 初始化当月每一天（可选，当前仅填充存在 timeslot 的日期）
        for (TimeSlot slot : timeSlots) {
            String dateKey = slot.getSlotDate().toString();
            CalendarResponseDTO.DateInfoDTO dateInfo = result.get(dateKey);
            if (dateInfo == null) {
                dateInfo = new CalendarResponseDTO.DateInfoDTO();
                dateInfo.setTimeSlots(0);
                dateInfo.setSessions(0);
                dateInfo.setStatus("empty");
                result.put(dateKey, dateInfo);
            }

            // 累加当天 slots 与 sessions
            dateInfo.setTimeSlots(dateInfo.getTimeSlots() + 1);
            dateInfo.setSessions(dateInfo.getSessions() + (slot.getSessionCount() == null ? 0 : slot.getSessionCount()));

            // 统计聚合状态：若存在 FULL 标记为 full；否则存在 PARTIAL 标记为 partial；否则 empty
            String currentStatus = dateInfo.getStatus();
            switch (slot.getStatus()) {
                case FULL:
                    dateInfo.setStatus("full");
                    break;
                case PARTIAL:
                    if (!"full".equals(currentStatus)) {
                        dateInfo.setStatus("partial");
                    }
                    break;
                case EMPTY:
                case DRAFT:
                case CLOSED:
                default:
                    // 保持现状（除非之前是 empty）
                    break;
            }
        }

        return result;
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

        // 1) assignment 必须已存在至少一个 venue
        List<Venue> venuesOfAssignment = venueMapper.listByAssignmentId(assignmentId);
        if (venuesOfAssignment == null || venuesOfAssignment.isEmpty()) {
            throw new BusinessException(BusinessError.ASSIGNMENT_HAS_NO_VENUE);
        }

        // 2) 如果该 assignment 下已有任何 time slot，先全部删除，再用本次请求替换
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
                // 3) 校验传入的 venueId 必须存在，且归属于该 assignment
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

        // 1) 校验 venueId 必须存在且属于该 assignment
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
        
        timeSlotMapper.updateById(existingSlot);

        // 删除该 slot 的全部旧 sessions，并记录被删除的会话用于响应
        List<SlotSession> oldSessions = slotSessionMapper.findBySlotId(timeSlotId);
        List<SessionDetailDTO> deleted = new ArrayList<>();
        if (!CollectionUtils.isEmpty(oldSessions)) {
            for (SlotSession s : oldSessions) {
                deleted.add(convertSessionToDTO(s));
            }
            slotSessionMapper.deleteBySlotId(timeSlotId);
        }

        // 按请求的 sessionCount 重新生成 sessions
        generateSessions(existingSlot, request.getSessionCount());

        UpdateTimeSlotResponseDTO response = new UpdateTimeSlotResponseDTO();
        response.setTimeSlot(convertToDetailDTO(existingSlot));
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
        
        // 将实际生成的场次数写回 slot 并持久化，保证数据库中为 min(请求值, 可容纳最大值)
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
        // End time: 根据 session 配置/请求的 sessionCount 由 generateSessions 负责写回 sessionCount 与生成场次；此处仅做窗口冲突使用 request 的 date+start/end(估算)
        // 估算 endAt 使用 config 中 sessionLength+gap 近似: sessionCount * (sessionLength+gap) - gap
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
        // 填充场地名称
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
        
        // Create examiner assignments(分配) for the new slot
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

            // Get examiner's current assigned sessions in this assignment
            int currentSessions = timeSlotMapper.sumAssignedSessionsForExaminer(assignmentId, examinerId);
            
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
