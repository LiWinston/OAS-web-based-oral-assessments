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
import java.util.Objects;
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
        
        // Re-import semantics: If assignmentId is provided, remove participants not in the new CSV
        if (assignmentIdParam != null) {
            handleReImport(studentDTOs, assignmentIdParam);
        }
        
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
                continue; // Create participation relation only for newly inserted students
            }

            // Prefer assignmentId from API parameter; fallback to per-row assignmentId if absent
            if (assignmentIdParam != null) {
                Long assignmentId = assignmentIdParam;
                // Avoid duplicate insertion: check if assignment-user relation already exists
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
                participant.setIfJoin(0); // Set to 0 on import; changed to 1 when released to students
                assignmentParticipantMapper.insert(participant);
                log.info("Linked user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
            } else {
                String assignmentIdStr = dto.getAssignmentId();
                if (StringUtils.isBlank(assignmentIdStr)) {
                    continue;
                }
                try {
                    Long assignmentId = Long.valueOf(assignmentIdStr);
                    // Avoid duplicate insertion: check if assignment-user relation already exists
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
                    participant.setIfJoin(0); // Set to 0 on import; changed to 1 when released to students
                    assignmentParticipantMapper.insert(participant);
                    log.info("Linked user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
                } catch (NumberFormatException ex) {
                    log.warn("Invalid assignmentId '{}' for studentId '{}', skipping", assignmentIdStr, dto.getStudentId());
                }
            }
        }

        // Create AssignmentParticipant relations for existing students (not included in invitedStudents)
        // Find users by email who already exist but weren't newly created
        Set<String> newStudentNumbers = invitedStudents.stream()
                .map(SysStudent::getStudentNumber)
                .collect(Collectors.toSet());
        
        // Build email list for existing students (those not newly created)
        List<String> existingStudentEmails = studentDTOs.stream()
                .filter(dto -> !newStudentNumbers.contains(dto.getStudentId()))
                .map(dto -> {
                    String sisLoginId = dto.getSisLoginId();
                    String email = dto.getEmail();
                    if (sisLoginId != null && !sisLoginId.trim().isEmpty()) {
                        return sisLoginId + "@student.unimelb.edu.au";
                    }
                    return email;
                })
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        if (!existingStudentEmails.isEmpty()) {
            // Query sys_user by email to get user_id
            QueryWrapper<org.swen90017.oas.entity.SysUser> userWrapper = new QueryWrapper<>();
            userWrapper.in("email", existingStudentEmails);
            List<org.swen90017.oas.entity.SysUser> existingUsers = userMapper.selectList(userWrapper);
            
            if (!existingUsers.isEmpty()) {
                // Use user_id to query sys_student
                List<Long> userIds = existingUsers.stream()
                        .map(org.swen90017.oas.entity.SysUser::getUserId)
                        .collect(Collectors.toList());
                
                QueryWrapper<SysStudent> studentWrapper = new QueryWrapper<>();
                studentWrapper.in("user_id", userIds);
                List<SysStudent> existingStudents = studentMapper.selectList(studentWrapper);
                
                log.info("Found {} existing students to link to assignment", existingStudents.size());
                
                // Create assignment participants for existing students
                for (SysStudent sysStudent : existingStudents) {
                    if (assignmentIdParam != null) {
                        Long assignmentId = assignmentIdParam;
                        QueryWrapper<AssignmentParticipant> existsWrapper = new QueryWrapper<>();
                        existsWrapper.eq("assignment_id", assignmentId)
                                .eq("user_id", sysStudent.getUserId())
                                .last("limit 1");
                        AssignmentParticipant existing = assignmentParticipantMapper.selectOne(existsWrapper);
                        if (existing != null) {
                            log.debug("Assignment participant already exists for user {} and assignment {}", sysStudent.getUserId(), assignmentId);
                            continue;
                        }

                        AssignmentParticipant participant = new AssignmentParticipant();
                        participant.setAssignmentId(assignmentId);
                        participant.setUserId(sysStudent.getUserId());
                        participant.setRoleId(UserRole.STUDENT.sort());
                        participant.setIfJoin(0); // Set to 0 on import; changed to 1 when released to students
                        assignmentParticipantMapper.insert(participant);
                        log.info("Linked existing user {} to assignment {} as STUDENT", sysStudent.getUserId(), assignmentId);
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
                StudentCSVRequestDTO::getStudent,      // Username extractor
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
    
    /**
     * Handle re-import semantics: remove participants not in the new CSV
     */
    private void handleReImport(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId) {
        log.info("Handling re-import for assignment {}", assignmentId);
        
        // Get all student identifiers from CSV (student_number or email)
        Set<String> csvStudentNumbers = studentDTOs.stream()
                .map(StudentCSVRequestDTO::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        Set<String> csvEmails = studentDTOs.stream()
                .map(dto -> {
                    if (dto.getSisLoginId() != null && !dto.getSisLoginId().isEmpty()) {
                        return dto.getSisLoginId() + "@student.unimelb.edu.au";
                    }
                    return dto.getEmail();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        log.info("CSV contains {} student numbers and {} emails", csvStudentNumbers.size(), csvEmails.size());
        
        // Get all current STUDENT participants for this assignment
        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId)
               .eq("role_id", UserRole.STUDENT.sort());
        List<AssignmentParticipant> currentParticipants = assignmentParticipantMapper.selectList(wrapper);
        
        if (currentParticipants.isEmpty()) {
            log.info("No existing student participants found for assignment {}", assignmentId);
            return;
        }
        
        log.info("Found {} existing student participants", currentParticipants.size());
        
        // Get user IDs to check
        List<Long> userIds = currentParticipants.stream()
                .map(AssignmentParticipant::getUserId)
                .collect(Collectors.toList());
        
        // Get students and users for these participants
        List<SysStudent> students = studentMapper.selectList(
                new QueryWrapper<SysStudent>().in("user_id", userIds)
        );
        List<SysUser> users = userMapper.selectBatchIds(userIds);
        
        // Build maps for quick lookup
        Map<Long, String> userIdToStudentNumber = students.stream()
                .collect(Collectors.toMap(SysStudent::getUserId, SysStudent::getStudentNumber));
        Map<Long, String> userIdToEmail = users.stream()
                .collect(Collectors.toMap(SysUser::getUserId, SysUser::getEmail));
        
        // Find participants to remove (not in CSV)
        List<Long> participantsToRemove = currentParticipants.stream()
                .filter(p -> {
                    String studentNumber = userIdToStudentNumber.get(p.getUserId());
                    String email = userIdToEmail.get(p.getUserId());
                    
                    boolean inCsvByNumber = studentNumber != null && csvStudentNumbers.contains(studentNumber);
                    boolean inCsvByEmail = email != null && csvEmails.contains(email);
                    
                    return !inCsvByNumber && !inCsvByEmail;
                })
                .map(AssignmentParticipant::getId)
                .collect(Collectors.toList());
        
        if (!participantsToRemove.isEmpty()) {
            log.info("Removing {} student participants not in the new CSV", participantsToRemove.size());
            assignmentParticipantMapper.deleteBatchIds(participantsToRemove);
            log.info("Successfully removed {} student participants", participantsToRemove.size());
        } else {
            log.info("All existing student participants are in the new CSV, no removal needed");
        }
    }
    
    @Override
    public void sendCourseJoinNotificationForExistingStudents(List<StudentCSVRequestDTO> studentDTOs, Long assignmentId) {

        
        if (studentDTOs == null || studentDTOs.isEmpty() || assignmentId == null) {
            return;
        }
        
        // Fetch course and assignment info
        Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) {
            return;
        }
        
        Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseName = subject != null ? subject.getSubjectName() : null;
        String assignmentName = assignment.getName();

        // Find existing registered users
        List<String> studentIds = studentDTOs.stream()
                .map(StudentCSVRequestDTO::getStudentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        if (studentIds.isEmpty()) {
            return;
        }
        
        // Query existing students
        QueryWrapper<SysStudent> wrapper = new QueryWrapper<>();
        wrapper.in("student_number", studentIds);
        List<SysStudent> existingStudents = studentMapper.selectList(wrapper);
        
        if (existingStudents.isEmpty()) {
            return;
        }
        
        // Get user info for these students
        List<Long> userIds = existingStudents.stream()
                .map(SysStudent::getUserId)
                .collect(Collectors.toList());
        
        List<SysUser> users = userMapper.selectBatchIds(userIds);

        // Filter registered users
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
