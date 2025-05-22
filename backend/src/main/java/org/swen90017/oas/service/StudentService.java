package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.entity.SysStudent;

import java.util.List;

public interface StudentService {
     List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs);
     Boolean registerStudent(String password, String token);

}
