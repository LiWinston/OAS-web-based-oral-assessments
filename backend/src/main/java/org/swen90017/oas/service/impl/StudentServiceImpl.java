package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.*;
import org.swen90017.oas.service.BaseCsvImportService;
import org.swen90017.oas.service.StudentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class StudentServiceImpl implements StudentService {
    private static final Logger log = LoggerFactory.getLogger(StudentServiceImpl.class);

    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysRoleMapper sysRoleMapper;
    @Autowired
    private SysStudentMapper studentMapper;
    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private BaseCsvImportService baseCsvImportService;
    @Autowired
    private SysAdminMapper adminMapper;

    @Override
    @Transactional
    public List<SysStudent> inviteStudent(List<StudentCSVRequestDTO> studentDTOs) {
        log.info("Inviting {} students from CSV request", studentDTOs.size());
        
        return baseCsvImportService.importStudents(
                studentDTOs,
                StudentCSVRequestDTO::getStudentId,    // Student ID extractor
                StudentCSVRequestDTO::getStudent,      // Username extractor
                StudentCSVRequestDTO::getSisLoginId    // SIS user ID extractor
        );
    }

    @Override
    @Transactional
    public SysUser register(RegisterRequestDTO requestDTO) {
        String token = requestDTO.getToken();
        String rawPassword = requestDTO.getPassword();
        if (token == null || token.isEmpty() || rawPassword == null || rawPassword.isEmpty()) {
            throw new BusinessException(BusinessError.BOOKING_VALIDATION_FAILED); // 复用已有错误码
        }

        // 1) Try student
        SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>().eq("token", token));
        if (student != null) {
            SysUser user = userMapper.selectById(student.getUserId());
            if (user == null) throw new BusinessException(BusinessError.USER_NOT_FOUND);
            user.setStatus(UserStatus.ACTIVE.code());
            user.setRegistrationStatus(RegistrationStatus.REGISTERED.code());
            user.setRegisteredAt(new java.util.Date());
            user.setPassword(passwordEncoder.encode(rawPassword));
            userMapper.updateById(user);
            return user;
        }
        // 2) Try admin
        SysAdmin admin = adminMapper.selectOne(new QueryWrapper<SysAdmin>().eq("token", token));
        if (admin != null) {
            SysUser user = userMapper.selectById(admin.getUserId());
            if (user == null) throw new BusinessException(BusinessError.USER_NOT_FOUND);
            user.setStatus(UserStatus.ACTIVE.code());
            user.setRegistrationStatus(RegistrationStatus.REGISTERED.code());
            user.setRegisteredAt(new java.util.Date());
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setUserName(requestDTO.getName());
            admin.setDepartment(requestDTO.getDepartment());
            userMapper.updateById(user);
            adminMapper.updateById(admin);
            return user;
        }

        // 3) Not found
        throw new BusinessException("Invalid registration link or token has expired");
    }

    @Override
    @SuppressWarnings("unchecked")
    public PreviewCSVResponseDTO previewStudentImport(List<StudentCSVRequestDTO> studentDTOs) {
        log.info("Previewing {} students from CSV request", studentDTOs.size());

        Map<String, Object> previewData = baseCsvImportService.previewImport(
                studentDTOs,
                StudentCSVRequestDTO::getStudentId
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
}
