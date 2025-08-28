package org.swen90017.oas.service.impl;

import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.service.ExaminerService;

import java.util.List;

@Service
public class ExaminerServiceImpl implements ExaminerService {
    @Override
    public List<SysExaminer> inviteExaminer(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS, Long assignmentId) {
        return null;
    }

    @Override
    public PreviewCSVResponseDTO previewExaminerImport(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS) {
        return null;
    }
}
