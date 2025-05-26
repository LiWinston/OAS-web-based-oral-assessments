package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.Error;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysUserRole;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.query.StudentQuery;
import org.swen90017.oas.service.StudentService;
import org.swen90017.oas.utils.QueryWrapperUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentServiceImpl implements StudentService {
    private static final Logger log = LoggerFactory.getLogger(StudentServiceImpl.class);

    @Autowired
    private SysUserMapper sysUserMapper;
    @Autowired
    private SysRoleMapper sysRoleMapper;
    @Autowired
    private SysStudentMapper sysStudentMapper;
    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs) {
        log.info("Inviting {} students from CSV request", studentDTOs.size());

        List<String> studentIds = studentDTOs.stream()
                .map(StudentCSVRequestDTO::getStudentId)
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

        List<StudentCSVRequestDTO> toInsert = studentDTOs.stream()
                .filter(dto -> !existingSet.contains(dto.getStudentId()))
                .collect(Collectors.toList());

        log.info("{} students are new and will be inserted", toInsert.size());

        List<SysUser> users = new ArrayList<>();
        for (StudentCSVRequestDTO dto : toInsert) {
            SysUser user = new SysUser();
            user.setUserName(dto.getStudent());
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
            StudentCSVRequestDTO dto = toInsert.get(i);

            userRoles.add(new SysUserRole(user.getUserId(), roleId));

            // Generate random token
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            log.debug("Generated token for student {}: {}", dto.getStudentId(), token);

            SysStudent sysStudent = new SysStudent();
            sysStudent.setStudentNumber(dto.getStudentId());
            sysStudent.setSisUserId(dto.getSisLoginId());
            sysStudent.setUserId(user.getUserId());
            sysStudent.setToken(token);
            sysStudents.add(sysStudent);
        }

        sysUserRoleMapper.batchInsert(userRoles);
        log.info("Inserted {} user-role mappings into sys_user_role table", userRoles.size());

        sysStudentMapper.batchInsert(sysStudents);
        log.info("Inserted {} students into sys_student table", sysStudents.size());

        return sysStudents;
    }

    @Override
    public Boolean registerStudent(String password, String token) {
        SysStudent student = sysStudentMapper.selectOne(new QueryWrapper<SysStudent>()
                .eq("token", token));

        if (student == null) {
            throw new BusinessException("Invalid registration link or token has expired");
        }
        Long userId = student.getUserId();
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(BusinessError.USER_NOT_FOUND);
        }
        user.setStatus("0");
        String encodedPassword = passwordEncoder.encode(password);
        user.setPassword(encodedPassword);
        sysUserMapper.updateById(user);

        return true;
    }

}
