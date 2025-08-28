package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.AssignExaminersRequestDTO;
import org.swen90017.oas.dto.response.GetAvailableExaminersResponseDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;
import org.swen90017.oas.entity.AssignmentSessionConfig;
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

    @Override
    public GetAvailableExaminersResponseDTO getAvailableExaminers(Long assignmentId) {
        AssignmentSessionConfig cfg = configMapper.selectById(assignmentId);
        int defaultMax = (cfg == null || cfg.getDefaultMaxSessionsPerExaminer() == null)
                ? 0 : cfg.getDefaultMaxSessionsPerExaminer();


        return null;
    }

    @Override
    public TimeSlotDetailDTO assignExaminersToSlot(Long assignmentId, Long timeSlotId, AssignExaminersRequestDTO request) {
        return null;
    }
}
