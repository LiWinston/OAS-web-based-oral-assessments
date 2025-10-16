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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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

        // Re-import semantics: If assignmentId is provided, remove participants not in the new CSV
        if (assignmentId != null) {
            handleReImport(examinerCSVRequestDTOS, assignmentId);
        }

        SecureRandom random = new java.security.SecureRandom();
        for (ExaminerCSVRequestDTO dto : examinerCSVRequestDTOS) {
            // Skip if essential fields are missing
            if (dto.getSisLoginId() == null || dto.getSisLoginId().trim().isEmpty()) {
                continue;
            }
            
            // Use email as unique identifier (email is the key, not ID which is just a label like "E002")
            String email = dto.getSisLoginId() + "@unimelb.edu.au";
            
            // 1) Check if user already exists by email
            QueryWrapper<SysUser> userQuery = new QueryWrapper<>();
            userQuery.eq("email", email).last("limit 1");
            SysUser user = sysUserMapper.selectOne(userQuery);
            
            if (user == null) {
                // User doesn't exist - create new user
                user = new SysUser();
                user.setUserName(dto.getName());
                user.setPassword("123456");
                user.setEmail(email);
                user.setStatus(UserStatus.INACTIVE.code());
                user.setRegistrationStatus(RegistrationStatus.Pending.code());
                user.setInvitedAt(new Date());
                sysUserMapper.insert(user);
            }
            // If user exists, continue with the same flow (no need to create user again)

            // 2) Grant EXAMINER role if not already granted
            Long examinerRoleId = getRoleIdByKey(UserRole.EXAMINER.code());
            SysUserRole existingRole = sysUserRoleMapper.selectByUserId(user.getUserId());
            if (existingRole == null || !examinerRoleId.equals(existingRole.getRoleId())) {
                sysUserRoleMapper.insert(new SysUserRole(user.getUserId(), examinerRoleId));
            }

            // 3) Check if examiner record exists, if not create it
            QueryWrapper<SysExaminer> examinerQuery = new QueryWrapper<>();
            examinerQuery.eq("user_id", user.getUserId()).last("limit 1");
            SysExaminer existingExaminer = examinerMapper.selectOne(examinerQuery);
            
            if (existingExaminer == null) {
                // Create new examiner record
                SysExaminer ex = new SysExaminer();
                ex.setUserId(user.getUserId());
                ex.setSisUserId(dto.getSisUserId());
                // Generate activation token
                byte[] bytes = new byte[32];
                random.nextBytes(bytes);
                String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
                ex.setToken(token);
                toInsert.add(ex);
            }

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
        PreviewCSVResponseDTO preview = new PreviewCSVResponseDTO();
        if (examinerCSVRequestDTOS == null || examinerCSVRequestDTOS.isEmpty()) {
            preview.setTotalCount(0);
            preview.setNewCount(0);
            preview.setExistingCount(0);
            return preview;
        }
        
        // Filter out blank rows (consistent with ExaminerCsvHandler.validate())
        // A row is blank only when Name, ID and SisUserId are all empty
        List<ExaminerCSVRequestDTO> validDTOs = examinerCSVRequestDTOS.stream()
                .filter(dto -> dto != null && !(
                    (dto.getName() == null || dto.getName().trim().isEmpty()) &&
                    (dto.getId() == null || dto.getId().trim().isEmpty()) &&
                    (dto.getSisUserId() == null || dto.getSisUserId().trim().isEmpty())
                ))
                .collect(Collectors.toList());
        
        // Check which examiners already exist in database
        Set<String> csvEmails = validDTOs.stream()
                .map(dto -> dto.getSisLoginId() != null && !dto.getSisLoginId().trim().isEmpty() 
                    ? dto.getSisLoginId() + "@unimelb.edu.au" 
                    : null)
                .filter(email -> email != null)
                .collect(Collectors.toSet());
        
        // Query existing users by email
        Set<String> existingEmails = new HashSet<>();
        if (!csvEmails.isEmpty()) {
            QueryWrapper<SysUser> query = new QueryWrapper<>();
            query.in("email", csvEmails);
            List<SysUser> existingUsers = sysUserMapper.selectList(query);
            existingEmails = existingUsers.stream()
                    .map(SysUser::getEmail)
                    .collect(Collectors.toSet());
        }
        
        // Count new vs existing examiners
        int newCount = 0;
        int existingCount = 0;
        
        for (ExaminerCSVRequestDTO dto : validDTOs) {
            if (dto.getSisLoginId() == null || dto.getSisLoginId().trim().isEmpty()) {
                continue; // Skip invalid records
            }
            String email = dto.getSisLoginId() + "@unimelb.edu.au";
            if (existingEmails.contains(email)) {
                existingCount++;
            } else {
                newCount++;
            }
        }
        
        preview.setTotalCount(validDTOs.size());
        preview.setNewCount(newCount);
        preview.setExistingCount(existingCount);
        return preview;
    }


    /**
     * Handle re-import semantics: remove participants not in the new CSV
     */
    private void handleReImport(List<ExaminerCSVRequestDTO> examinerDTOs, Long assignmentId) {
        // Get all examiner emails from CSV
        Set<String> csvEmails = examinerDTOs.stream()
                .map(dto -> {
                    if (dto.getSisLoginId() != null && !dto.getSisLoginId().trim().isEmpty()) {
                        return dto.getSisLoginId() + "@unimelb.edu.au";
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        // Get all current EXAMINER participants for this assignment
        QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
        wrapper.eq("assignment_id", assignmentId)
               .eq("role_id", UserRole.EXAMINER.sort());
        List<AssignmentParticipant> currentParticipants = assignmentParticipantMapper.selectList(wrapper);
        
        if (currentParticipants.isEmpty()) {
            return;
        }
        
        // Get user IDs to check
        List<Long> userIds = currentParticipants.stream()
                .map(AssignmentParticipant::getUserId)
                .collect(Collectors.toList());
        
        // Get users for these participants
        List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
        
        // Build map for quick lookup
        Map<Long, String> userIdToEmail = users.stream()
                .collect(Collectors.toMap(SysUser::getUserId, SysUser::getEmail));
        
        // Find participants to remove (not in CSV)
        List<Long> participantsToRemove = currentParticipants.stream()
                .filter(p -> {
                    String email = userIdToEmail.get(p.getUserId());
                    return email == null || !csvEmails.contains(email);
                })
                .map(AssignmentParticipant::getId)
                .collect(Collectors.toList());
        
        if (!participantsToRemove.isEmpty()) {
            assignmentParticipantMapper.deleteBatchIds(participantsToRemove);
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
