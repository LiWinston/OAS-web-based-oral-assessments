package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.entity.SysStudent;

import java.util.List;

public interface ExaminerService {
    List<SysExaminer> inviteExaminer(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS, Long assignmentId);
    PreviewCSVResponseDTO previewExaminerImport(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS);
}
