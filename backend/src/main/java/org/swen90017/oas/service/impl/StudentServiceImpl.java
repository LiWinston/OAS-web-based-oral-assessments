package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.StudentCSVRequestDTO;
import org.swen90017.oas.dto.response.PreviewCSVResponseDTO;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
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
    private SysUserMapper sysUserMapper;
    @Autowired
    private SysRoleMapper sysRoleMapper;
    @Autowired
    private SysStudentMapper sysStudentMapper;
    @Autowired
    private SysUserRoleMapper sysUserRoleMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private BaseCsvImportService baseCsvImportService;

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
        user.setStatus(UserStatus.ACTIVE.code());
        user.setRegistrationStatus(RegistrationStatus.REGISTERED.code());
        user.setRegisteredAt(new Date());
        String encodedPassword = passwordEncoder.encode(password);
        user.setPassword(encodedPassword);
        sysUserMapper.updateById(user);

        return true;
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
