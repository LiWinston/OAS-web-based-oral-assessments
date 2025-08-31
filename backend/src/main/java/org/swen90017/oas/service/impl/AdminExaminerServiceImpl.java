package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.AssignExaminersRequestDTO;
import org.swen90017.oas.dto.response.GetAvailableExaminersResponseDTO;
import org.swen90017.oas.dto.response.ExaminerDetailDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;
import org.swen90017.oas.entity.AssignmentSessionConfig;
import org.swen90017.oas.entity.ExaminerAssignmentLimit;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.AdminExaminerService;
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
    private SysUserMapper sysUserMapper;
    @Autowired
    private ExaminerAssignmentLimitMapper limitMapper;

    @Override
    public GetAvailableExaminersResponseDTO getAvailableExaminers(Long assignmentId, Long timeSlotId) {
        AssignmentSessionConfig cfg = configMapper.selectById(assignmentId);
        int defaultMax = (cfg == null || cfg.getDefaultMaxSessionsPerExaminer() == null)
                ? 0 : cfg.getDefaultMaxSessionsPerExaminer();
        // 简化：此处示例从 sys_user 表获取 examiner 用户；实际可基于角色、状态等筛选
        java.util.List<SysUser> users = this.baseListExaminers();
        java.util.List<ExaminerDetailDTO> list = new java.util.ArrayList<>();
        java.time.LocalDateTime slotStart = null;
        java.time.LocalDateTime slotEnd = null;
        if (timeSlotId != null) {
            org.swen90017.oas.entity.TimeSlot ts = timeSlotMapper.selectById(timeSlotId);
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
            // 个性化上限优先，否则用默认
            ExaminerAssignmentLimit lim = limitMapper.findByExaminerAndAssignment(u.getUserId(), assignmentId);
            int max = (lim != null && lim.getMaxSessions() != null) ? lim.getMaxSessions() : defaultMax;
            dto.setMaxSessions(max);
            // 当前任务已分配的 session 总数
            int assigned = timeSlotMapper.sumAssignedSessionsForExaminer(assignmentId, u.getUserId());
            dto.setCurrentAssignments(assigned);
            // 冲突检测：若提供 timeSlotId，则检查 examiner 在该时段是否与已分配 slot 冲突
            boolean hasConflict = false;
            if (slotStart != null && slotEnd != null) {
                java.util.List<Long> conflicted = tseMapper.findConflictedSlotsForExaminer(u.getUserId(), slotStart, slotEnd);
                hasConflict = conflicted != null && !conflicted.isEmpty();
            }
            // 可用性：需同时满足容量与无冲突
            String availability = (max == 0 || assigned < max) && !hasConflict ? "available" : "unavailable";
            dto.setAvailability(availability);
            list.add(dto);
        }
        GetAvailableExaminersResponseDTO resp = new GetAvailableExaminersResponseDTO();
        resp.setExaminers(list);
        return resp;
    }

    private java.util.List<SysUser> baseListExaminers() {
        // 暂用简单策略：查询所有用户作为示例。实际应基于角色表 sys_user_role 过滤 role=EXAMINER
        return sysUserMapper.selectList(null);
    }

    @Override
    public TimeSlotDetailDTO assignExaminersToSlot(Long assignmentId, Long timeSlotId, AssignExaminersRequestDTO request) {
        return null;
    }
}
