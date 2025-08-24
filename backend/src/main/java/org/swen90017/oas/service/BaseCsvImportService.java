package org.swen90017.oas.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.swen90017.oas.entity.*;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;

import java.security.SecureRandom;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Base CSV import service providing common logic for student import operations
 */
@Component
public class BaseCsvImportService {
    private static final Logger log = LoggerFactory.getLogger(BaseCsvImportService.class);
    
    @Autowired
    private SysUserMapper sysUserMapper;
    @Autowired
    private SysStudentMapper sysStudentMapper;
    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;
    @Autowired
    private SysRoleMapper sysRoleMapper;

    /**
     * Generic student import logic
     * 
     * @param csvData CSV data list
     * @param studentIdExtractor Function to extract student ID from CSV data
     * @param userNameExtractor Function to extract username from CSV data
     * @param sisUserIdExtractor Function to extract SIS user ID from CSV data
     * @param <T> CSV data type
     * @return List of newly created students
     */
    public <T> List<SysStudent> importStudents(List<T> csvData,
                                              Function<T, String> studentIdExtractor,
                                              Function<T, String> userNameExtractor,
                                              Function<T, String> sisUserIdExtractor) {
        log.info("Processing {} records from CSV data", csvData.size());
        // Extract and deduplicate student IDs
        List<String> studentIds = csvData.stream()
                .map(studentIdExtractor)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        log.debug("Built {} studentId(s) for duplicate checking", studentIds.size());

        // Query existing students
        Set<String> existingStudentIds = getExistingStudentIds(studentIds);
        log.debug("Found {} existing student numbers in the database", existingStudentIds.size());

        // Filter out new students to be inserted
        List<T> toInsert = csvData.stream()
                .filter(dto -> !existingStudentIds.contains(studentIdExtractor.apply(dto)))
                .collect(Collectors.toList());

        log.info("{} students are new and will be inserted", toInsert.size());

        if (toInsert.isEmpty()) {
            return new ArrayList<>();
        }

        // Create users
        List<SysUser> users = createUsers(toInsert, userNameExtractor, sisUserIdExtractor);
        
        // Create user role relationships
        createUserRoles(users);
        
        // Create student records
        List<SysStudent> sysStudents = createStudents(users, toInsert, studentIdExtractor, sisUserIdExtractor);
        sysStudents.forEach(student ->
                log.info("Created student: {} with ID: {}", student.getStudentNumber(), student.getUserId())
        );


        return sysStudents;
    }

    /**
     * Get existing student ID set
     */
    private Set<String> getExistingStudentIds(List<String> studentIds) {
        if (studentIds.isEmpty()) {
            return new HashSet<>();
        }

        QueryWrapper<SysStudent> wrapper = new QueryWrapper<>();
        wrapper.in("student_number", studentIds);
        List<SysStudent> matchedStudents = sysStudentMapper.selectList(wrapper);
        
        return matchedStudents.stream()
                .map(SysStudent::getStudentNumber)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    /**
     * Create user records
     */
    private <T> List<SysUser> createUsers(List<T> toInsert, Function<T, String> userNameExtractor,Function<T, String> sisUserIdExtractor) {
        List<SysUser> users = new ArrayList<>();
        for (T dto : toInsert) {
            SysUser user = new SysUser();
            user.setUserName(userNameExtractor.apply(dto));
            user.setStatus(UserStatus.INACTIVE.code());
            user.setRegistrationStatus(RegistrationStatus.INVITED.code());
            user.setInvitedAt(new Date());
            user.setPassword("123456");
            user.setEmail(sisUserIdExtractor.apply(dto)+"@student.unimelb.edu.au"); // Assuming SIS User ID is used as email
            users.add(user);
            log.info("Prepared SysUser object for user: {}", user);
        }

        log.info("Prepared {} SysUser objects for insertion", users.size());
        sysUserMapper.batchInsert(users);
        log.info("Inserted {} users into sys_user table", users.size());
        
        return users;
    }

    /**
     * Create user role relationships
     */
    private void createUserRoles(List<SysUser> users) {
        Long studentRoleId = getStudentRoleId();
        List<SysUserRole> userRoles = users.stream()
                .map(user -> new SysUserRole(user.getUserId(), studentRoleId))
                .collect(Collectors.toList());

        sysUserRoleMapper.batchInsert(userRoles);
        log.info("Inserted {} user-role mappings into sys_user_role table", userRoles.size());
    }

    /**
     * Get student role ID from database
     */
    private Long getStudentRoleId() {
        QueryWrapper<SysRole> wrapper = new QueryWrapper<>();
        wrapper.eq("role_key", UserRole.STUDENT.code());
        SysRole studentRole = sysRoleMapper.selectOne(wrapper);
        
        if (studentRole == null) {
            log.error("Student role not found in database with role_key: {}", UserRole.STUDENT.code());
            throw new RuntimeException("Student role not found in database");
        }
        
        log.debug("Found student role with ID: {}", studentRole.getRoleId());
        return studentRole.getRoleId();
    }

    /**
     * Create student records
     */
    private <T> List<SysStudent> createStudents(List<SysUser> users, List<T> csvData,
                                               Function<T, String> studentIdExtractor,
                                               Function<T, String> sisUserIdExtractor) {
        List<SysStudent> sysStudents = new ArrayList<>();
        SecureRandom random = new SecureRandom();

        for (int i = 0; i < users.size(); i++) {
            SysUser user = users.get(i);
            T dto = csvData.get(i);

            // Generate random token
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            
            String studentId = studentIdExtractor.apply(dto);
            log.debug("Generated token for student {}: {}", studentId, token);

            SysStudent sysStudent = new SysStudent();
            sysStudent.setStudentNumber(studentId);
            sysStudent.setSisUserId(sisUserIdExtractor.apply(dto));
            sysStudent.setUserId(user.getUserId());
            sysStudent.setToken(token);
            sysStudents.add(sysStudent);
        }

        sysStudentMapper.batchInsert(sysStudents);
        log.info("Inserted {} students into sys_student table", sysStudents.size());

        return sysStudents;
    }

    /**
     * Generic preview functionality
     */
    public <T> Map<String, Object> previewImport(List<T> csvData, Function<T, String> studentIdExtractor) {
        List<String> studentIds = csvData.stream()
                .map(studentIdExtractor)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Set<String> existingStudentIds = getExistingStudentIds(studentIds);

        List<T> newStudents = csvData.stream()
                .filter(dto -> !existingStudentIds.contains(studentIdExtractor.apply(dto)))
                .collect(Collectors.toList());

        List<T> existingStudents = csvData.stream()
                .filter(dto -> existingStudentIds.contains(studentIdExtractor.apply(dto)))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("newStudents", newStudents);
        result.put("existingStudents", existingStudents);
        result.put("totalCount", csvData.size());
        result.put("newCount", newStudents.size());
        result.put("existingCount", existingStudents.size());

        log.info("Preview complete: {} new students, {} existing students", 
                newStudents.size(), existingStudents.size());

        return result;
    }
} 