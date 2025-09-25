package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.ExaminerCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysUserRole;
import org.swen90017.oas.entity.SysRole;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.ExaminerMapper;
import org.swen90017.oas.service.ExaminerService;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ExaminerServiceImpl implements ExaminerService {

    @Autowired
    private ExaminerMapper examinerMapper;
    @Autowired
    private SysUserMapper sysUserMapper;
    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;
    @Autowired
    private SysRoleMapper sysRoleMapper;
    @Autowired
    private AssignmentParticipantMapper assignmentParticipantMapper;
    @Autowired
    private org.swen90017.oas.mapper.AssignmentMapper assignmentMapper;
    @Autowired
    private org.swen90017.oas.mapper.SubjectMapper subjectMapper;
    @Autowired
    private org.swen90017.oas.service.EmailService emailService;

    @Override
    public List<SysExaminer> inviteExaminer(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS, Long assignmentId) {
        List<SysExaminer> toInsert = new ArrayList<>();
        if (examinerCSVRequestDTOS == null || examinerCSVRequestDTOS.isEmpty()) {
            return toInsert;
        }

        SecureRandom random = new java.security.SecureRandom();
        for (ExaminerCSVRequestDTO dto : examinerCSVRequestDTOS) {
            Long userId = safeParseLong(dto.getId());
            if (userId == null) {
                continue;
            }
            // 1) Ensure sys_user exists; create if not
            SysUser user = sysUserMapper.selectById(userId);
            if (user != null) {
                if (assignmentId != null) {
                    QueryWrapper<AssignmentParticipant> exists = new QueryWrapper<>();
                    exists.eq("assignment_id", assignmentId).eq("user_id", user.getUserId()).last("limit 1");
                    AssignmentParticipant found = assignmentParticipantMapper.selectOne(exists);
                    if (found == null) {
                        AssignmentParticipant ap = new AssignmentParticipant();
                        ap.setAssignmentId(assignmentId);
                        ap.setUserId(user.getUserId());
                        ap.setRoleId(UserRole.EXAMINER.sort());
                        ap.setIfJoin(1);
                        assignmentParticipantMapper.insert(ap);
                    }
                }
                continue;
            } else {
                user = new SysUser();
                user.setUserId(userId);
                user.setUserName(dto.getName());
                user.setPassword("123456");
                user.setEmail(dto.getSisLoginId() + "@unimelb.edu.au");
                user.setStatus(UserStatus.INACTIVE.code());
                user.setRegistrationStatus(RegistrationStatus.Pending.code());
                user.setInvitedAt(new Date()); // Set invitation time
                sysUserMapper.insert(user);
            }

            // 2) Grant EXAMINER role if not already granted
            Long examinerRoleId = getRoleIdByKey(UserRole.EXAMINER.code());
            SysUserRole existingRole = sysUserRoleMapper.selectByUserId(user.getUserId());
            if (existingRole == null || !examinerRoleId.equals(existingRole.getRoleId())) {
                sysUserRoleMapper.insert(new SysUserRole(user.getUserId(), examinerRoleId));
            }

            // 3) Insert into sys_examiner
            SysExaminer ex = new SysExaminer();
            ex.setUserId(user.getUserId());
            ex.setSisUserId(dto.getSisUserId());
            // Generate activation token
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            ex.setToken(token);
            toInsert.add(ex);

            // 4) If assignmentId provided, create relation in assignment_participant (roleId=EXAMINER)
            if (assignmentId != null) {
                QueryWrapper<AssignmentParticipant> exists = new QueryWrapper<>();
                exists.eq("assignment_id", assignmentId).eq("user_id", user.getUserId()).last("limit 1");
                AssignmentParticipant found = assignmentParticipantMapper.selectOne(exists);
                if (found == null) {
                    AssignmentParticipant ap = new AssignmentParticipant();
                    ap.setAssignmentId(assignmentId);
                    ap.setUserId(user.getUserId());
                    ap.setRoleId(UserRole.EXAMINER.sort());
                    ap.setIfJoin(1);
                    assignmentParticipantMapper.insert(ap);
                }
            }
        }

        if (!toInsert.isEmpty()) {
            examinerMapper.batchInsert(toInsert);
        }
        return toInsert;
    }

    @Override
    public PreviewCSVResponseDTO previewExaminerImport(List<ExaminerCSVRequestDTO> examinerCSVRequestDTOS) {
        // Simplified: return counts and placeholders only (DTO is student preview structure; set counts only here)
        PreviewCSVResponseDTO preview = new PreviewCSVResponseDTO();
        if (examinerCSVRequestDTOS == null || examinerCSVRequestDTOS.isEmpty()) {
            preview.setTotalCount(0);
            preview.setNewCount(0);
            preview.setExistingCount(0);
            return preview;
        }
        
        // Filter out blank rows (consistent with ExaminerCsvHandler.validate())
        // A row is blank only when Name, ID and SisUserId are all empty
        long validCount = examinerCSVRequestDTOS.stream()
                .filter(dto -> dto != null && !(
                    (dto.getName() == null || dto.getName().trim().isEmpty()) &&
                    (dto.getId() == null || dto.getId().trim().isEmpty()) &&
                    (dto.getSisUserId() == null || dto.getSisUserId().trim().isEmpty())
                ))
                .count();
        
        int total = (int) validCount;
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

    @Override
    public void sendCourseJoinNotificationForExistingExaminers(List<ExaminerCSVRequestDTO> examinerDTOs, Long assignmentId) {
        if (examinerDTOs == null || examinerDTOs.isEmpty() || assignmentId == null) {
            return;
        }
        
        // Fetch course and assignment information
        org.swen90017.oas.entity.Assignment assignment = assignmentMapper.selectById(assignmentId);
        if (assignment == null) return;
        
        org.swen90017.oas.entity.Subject subject = subjectMapper.selectById(assignment.getSubjectId());
        String courseName = subject != null ? subject.getSubjectName() : null;
        String assignmentName = assignment.getName();
        
        // Find existing registered users (by email)
        List<String> emails = examinerDTOs.stream()
                .map(dto -> {
                    String sisLoginId = dto.getSisLoginId();
                    return sisLoginId != null ? sisLoginId + "@unimelb.edu.au" : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        if (emails.isEmpty()) return;
        
        // Query existing users
        QueryWrapper<org.swen90017.oas.entity.SysUser> wrapper = new QueryWrapper<>();
        wrapper.in("email", emails);
        List<org.swen90017.oas.entity.SysUser> existingUsers = sysUserMapper.selectList(wrapper);
        
        // Filter registered users
        List<org.swen90017.oas.entity.SysUser> registeredUsers = existingUsers.stream()
                .filter(user -> org.swen90017.oas.enums.UserStatus.ACTIVE.code().equals(user.getStatus()) 
                        && org.swen90017.oas.enums.RegistrationStatus.REGISTERED.code().equals(user.getRegistrationStatus()))
                .collect(Collectors.toList());
        
        if (!registeredUsers.isEmpty()) {
            emailService.sendExaminerCourseJoinNotification(registeredUsers, courseName, assignmentName);
        }
    }

    private Long getRoleIdByKey(String roleKey) {
        QueryWrapper<SysRole> w = new QueryWrapper<>();
        w.eq("role_key", roleKey).last("limit 1");
        SysRole role = sysRoleMapper.selectOne(w);
        return role != null ? role.getRoleId() : null;
    }
}
