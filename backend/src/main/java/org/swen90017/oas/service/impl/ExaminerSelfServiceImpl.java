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
import org.swen90017.oas.entity.*;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.ExaminerSelfService;
import org.swen90017.oas.service.SubjectService;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminerSelfServiceImpl implements ExaminerSelfService {

    private final AssignmentMapper assignmentMapper;
    private final AssignmentSessionConfigMapper configMapper;
    private final AssignmentParticipantMapper participantMapper;
    private final TimeSlotMapper timeSlotMapper;
    private final TimeSlotExaminersMapper tseMapper;
    private final SubjectService subjectService;
    private final VenueMapper venueMapper;
    private final ExaminerAssignmentLimitMapper examinerAssignmentLimitMapper;

    @Override
    public List<AssignmentResponseDTO> listAssignmentsAvailable(Long examinerId) {
        // 简化：返回所有 isReleased=true 的 assignment
        List<Assignment> all = assignmentMapper.selectList(new QueryWrapper<Assignment>().eq("is_released", true));
        return all.stream().map(this::toAssignmentDTO).collect(Collectors.toList());
    }

    @Override
    public List<SelectableTimeSlotDTO> listSelectableTimeSlots(Long assignmentId, Long examinerId) {
        List<TimeSlot> slots = timeSlotMapper.listByAssignment(assignmentId);
        Set<Long> already = new HashSet<>(tseMapper.listSlotsByExaminer(examinerId, assignmentId)
                .stream().map(TimeSlot::getSlotId).collect(Collectors.toSet()));

        List<SelectableTimeSlotDTO> result = new ArrayList<>();
        for (TimeSlot ts : slots) {
            SelectableTimeSlotDTO dto = toSelectable(ts);
            dto.setAssigned(already.contains(ts.getSlotId()));
            dto.setFull(ts.getCurrentExaminers() != null && ts.getRequiredExaminers() != null
                    && ts.getCurrentExaminers() >= ts.getRequiredExaminers());
            // 冲突判断：与该 slot 时间段重叠的既有分配
            boolean conflict = !tseMapper.findConflictedSlotsForExaminer(examinerId, ts.getStartAt(), ts.getEndAt()).isEmpty();
            dto.setConflict(conflict);
            result.add(dto);
        }
        return result;
    }

    @Override
    @Transactional
    public PartialAssignmentResultDTO bulkAssign(Long assignmentId, ExaminerBulkAssignRequestDTO request) {
        Long examinerId = request.getExaminerId();
        // 1) 校验 examiner 属于 assignment（存在参与关系或全局放行）
        AssignmentParticipant rel = participantMapper.selectOne(new QueryWrapper<AssignmentParticipant>()
                .eq("assignment_id", assignmentId).eq("user_id", examinerId).last("limit 1"));
        if (rel == null) {
            throw new BusinessException(BusinessError.ASSIGNMENT_NOT_FOUND);
        }

        // 2) 读取 maxSessions 配置 - 优先读取个性化限制，否则读取默认配置
        ExaminerAssignmentLimit personalLimit = examinerAssignmentLimitMapper.findByExaminerAndAssignment(examinerId, assignmentId);
        Integer maxSessions = null;
        
        if (personalLimit != null && personalLimit.getMaxSessions() != null) {
            // 使用个性化限制
            maxSessions = personalLimit.getMaxSessions();
        } else {
            // 使用默认配置
            AssignmentSessionConfig cfg = configMapper.selectById(assignmentId);
            maxSessions = cfg == null ? null : cfg.getDefaultMaxSessionsPerExaminer();
        }

        // 3) 统计已分配 session 数
        int currentSessions = timeSlotMapper.sumAssignedSessionsForExaminer(assignmentId, examinerId);

        PartialAssignmentResultDTO result = new PartialAssignmentResultDTO();

        for (Long slotId : request.getSlotIds()) {
            TimeSlot ts = timeSlotMapper.selectById(slotId);
            if (ts == null || !Objects.equals(ts.getAssignmentId(), assignmentId)) {
                addFailure(result, slotId, "slot_not_found");
                continue;
            }
            if (Boolean.TRUE.equals(ts.getBookingOpen()) == Boolean.FALSE) {
                // 若有开放开关，未开放时可视作不可报名
            }
            // 容量
            if (ts.getCurrentExaminers() != null && ts.getRequiredExaminers() != null
                    && ts.getCurrentExaminers() >= ts.getRequiredExaminers()) {
                addFailure(result, slotId, "slot_full");
                continue;
            }
            // 冲突
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

            // 执行分配：插入关系，更新计数
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
        List<TimeSlot> slots = tseMapper.listSlotsByExaminer(examinerId, assignmentId);
        Map<Long, List<TimeSlot>> byAssignment = slots.stream().collect(Collectors.groupingBy(TimeSlot::getAssignmentId));

        List<ExaminerScheduleResponseDTO.AssignmentScheduleDTO> assignments = new ArrayList<>();
        for (Map.Entry<Long, List<TimeSlot>> e : byAssignment.entrySet()) {
            Long aId = e.getKey();
            Assignment a = assignmentMapper.selectById(aId);
            ExaminerScheduleResponseDTO.AssignmentScheduleDTO as = new ExaminerScheduleResponseDTO.AssignmentScheduleDTO();
            as.setAssignmentId(aId);
            as.setAssignmentName(a != null ? a.getName() : null);

            // 补充课程信息
            if (a != null && a.getSubjectId() != null) {
                try {
                    Subject subj = subjectService.getSubjectById(a.getSubjectId());
                    if (subj != null) {
                        as.setCourseCode(subj.getSubjectCode());
                        as.setCourseName(subj.getSubjectName());
                    }
                } catch (BusinessException ex) {
                    // 如果课程不存在或已删除，设置默认值继续处理
                    as.setCourseCode("N/A");
                    as.setCourseName("Course Unavailable");
                }
            }

            List<ExaminerScheduleResponseDTO.SlotScheduleDTO> slotDtos = new ArrayList<>();
            for (TimeSlot ts : e.getValue()) {
                ExaminerScheduleResponseDTO.SlotScheduleDTO sd = new ExaminerScheduleResponseDTO.SlotScheduleDTO();
                sd.setSlotId(ts.getSlotId());
                sd.setStart(ts.getStartAt().toString());
                sd.setEnd(ts.getEndAt().toString());
                ExaminerScheduleResponseDTO.VenueInfo v = new ExaminerScheduleResponseDTO.VenueInfo();
                Venue venue = venueMapper.selectById(ts.getVenueId());
                if (venue != null) {
                    v.setBuilding(venue.getBuilding());
                    v.setRoom(venue.getRoomName());
                }
                sd.setVenue(v);
                sd.setSessionCount(ts.getSessionCount());
                sd.setRequiredExaminers(ts.getRequiredExaminers());
                sd.setCurrentExaminers(ts.getCurrentExaminers());
                sd.setIsBooked((ts.getBookedSessions() != null) && ts.getBookedSessions() > 0);
                sd.setBookingCount(ts.getBookedSessions());
                sd.setCanWithdraw(false);
                sd.setCannotWithdrawReason(sd.getIsBooked() ? "STUDENT BOOKED" : null);
                slotDtos.add(sd);
            }
            as.setSlots(slotDtos);
            assignments.add(as);
        }

        ExaminerScheduleResponseDTO out = new ExaminerScheduleResponseDTO();
        out.setAssignments(assignments);
        return out;
    }

    @Override
    @Transactional
    public ExaminerUnassignResponseDTO unassign(Long assignmentId, Long slotId, Long examinerId) {
        TimeSlot ts = timeSlotMapper.selectById(slotId);
        if (ts == null || !Objects.equals(ts.getAssignmentId(), assignmentId)) {
            throw new BusinessException(BusinessError.TIME_SLOT_NOT_FOUND);
        }
        // TODO: 截止时间与学生 booking 限制（无相关结构，先略过）
        int removed = tseMapper.deleteOne(slotId, examinerId);
        if (removed > 0) {
            int newCurrent = Math.max(0, (ts.getCurrentExaminers() == null ? 0 : ts.getCurrentExaminers()) - 1);
            int booked = ts.getBookedSessions() == null ? 0 : ts.getBookedSessions();
            timeSlotMapper.updateCountersAndStatus(slotId, newCurrent, booked);
        }

        // 计算更新后的总分配session数
        int updatedAssignedSessions = timeSlotMapper.sumAssignedSessionsForExaminer(assignmentId, examinerId);

        // 构造响应DTO
        ExaminerUnassignResponseDTO response = new ExaminerUnassignResponseDTO();
        response.setAssignmentId(assignmentId);
        response.setSlotId(slotId);
        response.setExaminerId(examinerId);
        response.setUpdatedAssignedSessions(updatedAssignedSessions);

        return response;
    }

    private AssignmentResponseDTO toAssignmentDTO(Assignment a) {
        AssignmentResponseDTO dto = new AssignmentResponseDTO();
        dto.setId(a.getId());
        dto.setSubjectId(a.getSubjectId());
        dto.setName(a.getName());
        dto.setDescription(a.getDescription());
        dto.setType(a.getType());
        dto.setStartDate(a.getStartDate());
        dto.setEndDate(a.getEndDate());
        dto.setWeight(a.getWeight());
        dto.setProgress(a.getProgress());
        dto.setStatus(a.getStatus());
        dto.setRubricMetaInfo(a.getRubricMetaInfo());

        // 补上rubric info
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
}


