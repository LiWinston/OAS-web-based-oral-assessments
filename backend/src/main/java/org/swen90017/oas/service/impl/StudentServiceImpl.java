package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.BaseCsvImportService;
import org.swen90017.oas.service.StudentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.stream.Collectors;

@Service
public class StudentServiceImpl implements StudentService {
    private static final Logger log = LoggerFactory.getLogger(StudentServiceImpl.class);

    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysStudentMapper studentMapper;
    @Autowired
    private BaseCsvImportService baseCsvImportService;
    @Autowired
    private AssignmentParticipantMapper assignmentParticipantMapper;
    @Autowired
    private org.swen90017.oas.mapper.AssignmentMapper assignmentMapper;
    @Autowired
    private org.swen90017.oas.mapper.SubjectMapper subjectMapper;
    @Autowired
    private org.swen90017.oas.service.EmailService emailService;

    @Override
    @Transactional
    public List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs, Long assignmentIdParam) {
        log.info("Inviting {} students from CSV request", studentDTOs.size());
        
        List<SysStudent> invitedStudents = baseCsvImportService.importStudents(
                studentDTOs,
                StudentCSVRequestDTO::getStudentId,    // Student ID extractor
                StudentCSVRequestDTO::getStudent,      // Username extractor
                StudentCSVRequestDTO::getSisLoginId,   // SIS user ID extractor
                StudentCSVRequestDTO::getEmail         // Email extractor
        );

        Map<String, SysStudent> studentIdToStudent = invitedStudents.stream()
                .collect(Collectors.toMap(SysStudent::getStudentNumber, s -> s));

        for (StudentCSVRequestDTO dto : studentDTOs) {
            dto.setAssignmentId(assignmentIdParam != null ? String.valueOf(assignmentIdParam) : dto.getAssignmentId());
            SysStudent sysStudent = studentIdToStudent.get(dto.getStudentId());
            if (sysStudent == null) {
                continue; // 仅对新插入的学生创建参与关系
            }

            // 优先使用上传接口传入的 assignmentId，如果没有则回退到每行的 assignmentId
            if (assignmentIdParam != null) {
                Long assignmentId = assignmentIdParam;
                // 避免重复插入：检查是否已存在该 assignment 与 user 的关系
                QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
                existsWrapper.eq("assignment_id", assignmentId)
                        .eq("user_id", sysStudent.getUserId())
                        .last("limit 1");
                AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
                if (existing != null) {
                    continue;
                }

                AssignmentParticipant participant = new AssignmentParticipant();
                participant.setAssignmentId(assignmentId);
                participant.setUserId(sysStudent.getUserId());
                participant.setRoleId(UserRole.STUDENT.sort());
                participant.setIfJoin(0); // 导入时设置为0，release to student时才改为1
                assignmentParticipantMapper.insert(participant);
                log.info("Linked user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
            } else {
                String assignmentIdStr = dto.getAssignmentId();
                if (StringUtils.isBlank(assignmentIdStr)) {
                    continue;
                }
                try {
                    Long assignmentId = Long.valueOf(assignmentIdStr);
                    // 避免重复插入：检查是否已存在该 assignment 与 user 的关系
                    QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
                    existsWrapper.eq("assignment_id", assignmentId)
                            .eq("user_id", sysStudent.getUserId())
                            .last("limit 1");
                    AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
                    if (existing != null) {
                        continue;
                    }

                    AssignmentParticipant participant = new AssignmentParticipant();
                    participant.setAssignmentId(assignmentId);
                    participant.setUserId(sysStudent.getUserId());
                    participant.setRoleId(UserRole.STUDENT.sort());
                    participant.setIfJoin(0); // 导入时设置为0，release to student时才改为1
                    assignmentParticipantMapper.insert(participant);
                    log.info("Linked user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
                } catch (NumberFormatException ex) {
                    log.warn("Invalid assignmentId '{}' for studentId '{}', skipping", assignmentIdStr, dto.getStudentId());
                }
            }
        }

        // 为已存在学生创建 AssignmentParticipant 关系
        Set<String> allIds = studentDTOs.stream().map(StudentCSVRequestDTO::getStudentId).collect(Collectors.toSet());
        Set<String> newIds = invitedStudents.stream().map(SysStudent::getStudentNumber).collect(Collectors.toSet());
        Set<String> existingIds = new HashSet<>(allIds);
        existingIds.removeAll(newIds);

        if (!existingIds.isEmpty()) {
            List<SysStudent> existingStudents = studentMapper.selectList(
                    new QueryWrapper<SysStudent>().in("student_number", existingIds)
            );

            Map<String, SysStudent> existingMap = existingStudents.stream()
                    .collect(Collectors.toMap(SysStudent::getStudentNumber, s -> s));

            Map<String, String> studentIdToAssignmentId = studentDTOs.stream()
                    .collect(Collectors.toMap(StudentCSVRequestDTO::getStudentId, StudentCSVRequestDTO::getAssignmentId, (a, b) -> a));

            for (Map.Entry<String, SysStudent> entry : existingMap.entrySet()) {
                String studentId = entry.getKey();
                SysStudent sysStudent = entry.getValue();
                if (assignmentIdParam != null) {
                    Long assignmentId = assignmentIdParam;
                    QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
                    existsWrapper.eq("assignment_id", assignmentId)
                            .eq("user_id", sysStudent.getUserId())
                            .last("limit 1");
                    AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
                    if (existing != null) {
                        continue;
                    }

                    AssignmentParticipant participant = new AssignmentParticipant();
                    participant.setAssignmentId(assignmentId);
                    participant.setUserId(sysStudent.getUserId());
                    participant.setRoleId(UserRole.STUDENT.sort());
                    participant.setIfJoin(0); // 导入时设置为0，release to student时才改为1
                    assignmentParticipantMapper.insert(participant);
                    log.info("Linked existing user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
                } else {
                    String assignmentIdStr = studentIdToAssignmentId.get(studentId);
                    if (StringUtils.isBlank(assignmentIdStr)) {
                        continue;
                    }
                    try {
                        Long assignmentId = Long.valueOf(assignmentIdStr);
                        QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
                        existsWrapper.eq("assignment_id", assignmentId)
                                .eq("user_id", sysStudent.getUserId())
                                .last("limit 1");
                        AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
                        if (existing != null) {
                            continue;
                        }

                        AssignmentParticipant participant = new AssignmentParticipant();
                        participant.setAssignmentId(assignmentId);
                        participant.setUserId(sysStudent.getUserId());
                        participant.setRoleId(UserRole.STUDENT.sort());
                        participant.setIfJoin(0); // 导入时设置为0，release to student时才改为1
                        assignmentParticipantMapper.insert(participant);
                        log.info("Linked existing user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
                    } catch (NumberFormatException ex) {
                        log.warn("Invalid assignmentId '{}' for existing studentId '{}', skipping", assignmentIdStr, studentId);
                    }
                }
            }
        }

        return invitedStudents;
    }

    @Override
    @SuppressWarnings("unchecked")
    public PreviewCSVResponseDTO previewStudentImport(List<StudentCSVRequestDTO> studentDTOs) {
        log.info("Previewing {} students from CSV request", studentDTOs.size());

        Map<String, Object> previewData = baseCsvImportService.previewImport(
                studentDTOs,
                StudentCSVRequestDTO::getStudentId,
                StudentCSVRequestDTO::getSisLoginId
        );

        // Build preview response
        PreviewCSVResponseDTO previewResponse = new PreviewCSVResponseDTO();
        previewResponse.setNewStudents((List<StudentCSVRequestDTO>) previewData.get("newStudents"));
        previewResponse.setExistingStudents((List<StudentCSVRequestDTO>) previewData.get("existingStudents"));
        previewResponse.setTotalCount((Integer) previewData.get("totalCount"));
        previewResponse.setNewCount((Integer) previewData.get("newCount"));
        previewResponse.setExistingCount((Integer) previewData.get("existingCount"));

        return previewResponse;
    }
    
    @Override
    public void sendCourseJoinNotificationForExistingStudents(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId) {

        
        if (studentDTOs == null || studentDTOs.isEmpty() || assignmentId == null) {
            return;
        }
        
        // 获取课程和作业信息
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            return;
        }
        
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseName = subject != null ? subject.getSubjectName() : null;
        String assignmentName = assignment.getName();

        // 查找已注册的现有用户
        List<String> studentIds = studentDTOs.stream()
                .map(StudentCSVRequestDTO::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        if (studentIds.isEmpty()) {
            return;
        }
        
        // 查询现有学生
        QueryWrapper<SysStudent> wrapper = new QueryWrapper<>();
        wrapper.in("student_number", studentIds);
        List<SysStudent> existingStudents = studentMapper.selectList(wrapper);
        
        if (existingStudents.isEmpty()) {
            return;
        }
        
        // 获取这些学生的用户信息
        List<Long> userIds = existingStudents.stream()
                .map(SysStudent::getUserId)
                .collect(Collectors.toList());
        
        List<SysUser> users = userMapper.selectBatchIds(userIds);

        // 筛选出已注册的用户
        List<SysUser> registeredUsers = users.stream()
                .filter(user -> {
                    boolean isActive = org.swen90017.oas.enums.UserStatus.ACTIVE.code().equals(user.getStatus());
                    boolean isRegistered = org.swen90017.oas.enums.RegistrationStatus.REGISTERED.code().equals(user.getRegistrationStatus());
                    return isActive && isRegistered;
                })
                .collect(Collectors.toList());
        
        log.info("Registered users eligible for notification: {}", registeredUsers.size());
        if (!registeredUsers.isEmpty()) {
            log.info("Sending course-join notifications to users: {}", 
                    registeredUsers.stream().map(SysUser::getEmail).collect(Collectors.toList()));
            emailService.sendCourseJoinNotification(registeredUsers, courseName, assignmentName);
            log.info("Course-join notifications sent successfully");
        } else {
            log.info("No eligible registered users found. Skipping notifications");
        }
    }
}
