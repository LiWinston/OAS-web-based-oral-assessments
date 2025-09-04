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
import java.util.List;

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
            // 1) 确保 sys_user 存在；若不存在则创建
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
                sysUserMapper.insert(user);
            }

            // 2) 赋予 EXAMINER 角色（若未赋予）
            Long examinerRoleId = getRoleIdByKey(UserRole.EXAMINER.code());
            SysUserRole existingRole = sysUserRoleMapper.selectByUserId(user.getUserId());
            if (existingRole == null || !examinerRoleId.equals(existingRole.getRoleId())) {
                sysUserRoleMapper.insert(new SysUserRole(user.getUserId(), examinerRoleId));
            }

            // 3) 插入 sys_examiner
            SysExaminer ex = new SysExaminer();
            ex.setUserId(user.getUserId());
            ex.setSisUserId(dto.getSisUserId());
            // 生成激活 token
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            ex.setToken(token);
            toInsert.add(ex);

            // 4) 若传入 assignmentId，则在 assignment_participant 建立关系（roleId=EXAMINER）
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

    private Long getRoleIdByKey(String roleKey) {
        QueryWrapper<SysRole> w = new QueryWrapper<>();
        w.eq("role_key", roleKey).last("limit 1");
        SysRole role = sysRoleMapper.selectOne(w);
        return role != null ? role.getRoleId() : null;
    }
}
