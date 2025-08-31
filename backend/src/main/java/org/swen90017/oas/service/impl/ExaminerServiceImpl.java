package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.mapper.ExaminerMapper;
import org.swen90017.oas.service.ExaminerService;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExaminerServiceImpl implements ExaminerService {

    @Autowired
    private ExaminerMapper examinerMapper;

    @Override
    public List<SysExaminer> inviteExaminer(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS, Long assignmentId) {
        List<SysExaminer> toInsert = new ArrayList<>();
        if (examinerCSVRequestDTOS == null || examinerCSVRequestDTOS.isEmpty()) {
            return toInsert;
        }

        for (ExaminerCSVRequestDTO dto : examinerCSVRequestDTOS) {
            Long userId = safeParseLong(dto.getId());
            if (userId == null) {
                continue;
            }
            SysExaminer ex = new SysExaminer();
            ex.setUserId(userId);
            ex.setSisUserId(dto.getSisUserId());
            ex.setToken(null);
            toInsert.add(ex);
        }

        if (!toInsert.isEmpty()) {
            examinerMapper.batchInsert(toInsert);
        }
        return toInsert;
    }

    @Override
    public PreviewCSVResponseDTO previewExaminerImport(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS) {
        // 简化：仅返回计数等占位信息（该 DTO 为学生预览结构，这里仅设置计数）
        PreviewCSVResponseDTO preview = new PreviewCSVResponseDTO();
        int total = examinerCSVRequestDTOS == null ? 0 : examinerCSVRequestDTOS.size();
        preview.setTotalCount(total);
        preview.setNewCount(total);
        preview.setExistingCount(0);
        return preview;
    }

    private Long safeParseLong(String s) {
        if (s == null) return null;
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
