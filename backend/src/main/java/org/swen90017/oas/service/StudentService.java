package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;

import java.util.List;

public interface StudentService {
     List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId);
     PreviewCSVResponseDTO previewStudentImport(List<StudentCSVRequestDTO> studentDTOs);
     
     /**
      * 为CSV导入中已注册的现有学生发送课程加入通知
      */
     void sendCourseJoinNotificationForExistingStudents(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId);
}
