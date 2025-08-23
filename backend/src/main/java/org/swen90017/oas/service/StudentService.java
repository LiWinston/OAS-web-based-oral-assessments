package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;

import java.util.List;

public interface StudentService {
     List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs);
     SysUser register(RegisterRequestDTO requestDTO);
     PreviewCSVResponseDTO previewStudentImport(List<StudentCSVRequestDTO> studentDTOs);
}
