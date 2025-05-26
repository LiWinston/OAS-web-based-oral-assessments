package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.request.GroupCSVRequestDTO;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.GroupService;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GroupServiceImpl implements GroupService {
    @Autowired
    SysStudentMapper studentMapper;
    @Autowired
    SysStudentGroupMapper studentGroupMapper;
    @Autowired
    GroupMapper groupMapper;
    @Autowired
    SysStudentMapper sysStudentMapper;
    @Autowired
    SysUserMapper sysUserMapper;
    @Autowired
    SysUserRoleMapper sysUserRoleMapper;

    @Override
    public List<SysStudent> importGroupData(List<GroupCSVRequestDTO> dtos) {
        List<String> studentIds = dtos.stream()
                .map(GroupCSVRequestDTO::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        log.debug("Built {} studentId(s) for duplicate checking", studentIds.size());
        List<SysStudent> matchedStudents = new ArrayList<>();
        if (!studentIds.isEmpty()) {
            QueryWrapper<SysStudent> wrapper = new QueryWrapper<>();
            wrapper.in("student_number", studentIds);
            matchedStudents = sysStudentMapper.selectList(wrapper);
            log.debug("Matched {} existing students from database", matchedStudents.size());
        }

        List<String> existingStudentNumbers = matchedStudents.stream()
                .map(SysStudent::getStudentNumber)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        log.debug("Found {} existing student numbers in the database", existingStudentNumbers.size());

        Set<String> existingSet = new HashSet<>(existingStudentNumbers);

        List<GroupCSVRequestDTO> toInsert = dtos.stream()
                .filter(dto -> !existingSet.contains(dto.getUserId()))
                .collect(Collectors.toList());

        log.info("{} students are new and will be inserted", toInsert.size());

        List<SysUser> users = new ArrayList<>();
        for (GroupCSVRequestDTO dto : toInsert) {
            SysUser user = new SysUser();
            user.setUserName(dto.getName());
            user.setStatus("2"); // 0:active, 1:deleted, 2:inactive
            user.setPassword("123456");
            users.add(user);
        }

        log.debug("Prepared {} SysUser objects for insertion", users.size());
        sysUserMapper.batchInsert(users);
        log.info("Inserted {} users into sys_user table", users.size());

        Long roleId = 2L; // TODO: get role id from role table
        List<SysUserRole> userRoles = new ArrayList<>();
        List<SysStudent> sysStudents = new ArrayList<>();
        SecureRandom random = new SecureRandom();

        for (int i = 0; i < users.size(); i++) {
            SysUser user = users.get(i);
            GroupCSVRequestDTO dto = toInsert.get(i);

            userRoles.add(new SysUserRole(user.getUserId(), roleId));

            // Generate random token
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            log.debug("Generated token for student {}: {}", dto.getUserId(), token);

            SysStudent sysStudent = new SysStudent();
            sysStudent.setStudentNumber(dto.getUserId());
            sysStudent.setSisUserId(dto.getLoginId());
            sysStudent.setUserId(user.getUserId());
            sysStudent.setToken(token);
            sysStudents.add(sysStudent);
        }

        sysUserRoleMapper.batchInsert(userRoles);
        log.info("Inserted {} user-role mappings into sys_user_role table", userRoles.size());

        sysStudentMapper.batchInsert(sysStudents);
        log.info("Inserted {} students into sys_student table", sysStudents.size());


        Map<String, SysGroup> groupMap = new HashMap<>();
        for (GroupCSVRequestDTO dto : dtos) {
            String canvasGroupId = dto.getCanvasGroupId();
            if (!groupMap.containsKey(canvasGroupId)) {
                SysGroup group = groupMapper.selectByCanvasGroupId(canvasGroupId);
                if (group == null) {
                    group = new SysGroup();
                    group.setGroupName(dto.getGroupName());
                    group.setCanvasGroupId(canvasGroupId);
                    group.setCreateTime(LocalDateTime.now());
                    groupMapper.insert(group);
                    System.out.println("Inserted groupId = " + group.getGroupId());
                }
                groupMap.put(canvasGroupId, group);
            }
        }

        List<SysStudentGroup> relations = new ArrayList<>();
        for (GroupCSVRequestDTO dto : dtos) {
            SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>()
                    .eq("student_number",dto.getUserId()));
            SysGroup group = groupMap.get(dto.getCanvasGroupId());
            if (student != null && group != null) {
                relations.add(new SysStudentGroup(student.getUserId(), group.getGroupId()));
            }
        }

        studentGroupMapper.batchInsert(relations);
        return sysStudents;
    }
}
