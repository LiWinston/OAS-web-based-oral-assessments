package org.swen90017.oas.controller;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.response.RegistrationPreviewResponseDTO;
import org.swen90017.oas.service.StudentService;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.mapper.SysAdminMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.exception.BusinessException;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

@RestController
public class RegisterController {
    @Autowired
    StudentService studentService;
    @Autowired
    SysUserMapper userMapper;
    @Autowired
    SysAdminMapper adminMapper;
    @Autowired
    SysStudentMapper studentMapper;
    @PostMapping("/register")
    public Result<String> login(@Validated @RequestBody RegisterRequestDTO requestDTO) {
        studentService.registerStudent(requestDTO.getPassword(), requestDTO.getToken());
        return Result.success("Register successfully");
    }

    @GetMapping("/register/preview")
    public Result<RegistrationPreviewResponseDTO> preview(@RequestParam("token") String token) {
        // On-demand expiry for students
        try {
            Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            cal.add(Calendar.DAY_OF_MONTH, -7);
            Date expireBefore = cal.getTime();
            UpdateWrapper<SysUser> uw = new UpdateWrapper<>();
            uw.eq("status", UserStatus.INACTIVE.code())
              .eq("registration_status", RegistrationStatus.INVITED.code())
              .lt("invited_at", expireBefore)
              .set("registration_status", RegistrationStatus.EXPIRED.code());
            userMapper.update(null, uw);
        } catch (Exception ignored) {}
        // Try student first
        SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>().eq("token", token));
        if (student != null) {
            Long userId = student.getUserId();
            SysUser user = userMapper.selectById(userId);
            if (user == null) throw new BusinessException("User not found");
            RegistrationPreviewResponseDTO dto = new RegistrationPreviewResponseDTO();
            dto.setRole("STUDENT");
            dto.setUserId(userId);
            dto.setEmail(user.getEmail());
            dto.setName(user.getUserName());
            dto.setStatus(UserStatus.fromCode(user.getStatus()) != null ? UserStatus.fromCode(user.getStatus()).name() : null);
            if (user.getRegistrationStatus() != null) {
                RegistrationStatus rs = RegistrationStatus.fromCode(user.getRegistrationStatus());
                dto.setStatus(rs != null ? rs.name() : dto.getStatus());
            }
            dto.setInvitedAt(user.getInvitedAt());
            dto.setRegisteredAt(user.getRegisteredAt());
            dto.setLastLoginAt(user.getLastLoginAt());
            dto.setSisUserId(student.getSisUserId());
            dto.setStudentNumber(student.getStudentNumber());
            return Result.success(dto);
        }

        // Try admin next
        SysAdmin admin = adminMapper.selectOne(new QueryWrapper<SysAdmin>().eq("token", token));
        if (admin != null) {
            Long userId = admin.getUserId();
            SysUser user = userMapper.selectById(userId);
            if (user == null) throw new BusinessException("User not found");
            RegistrationPreviewResponseDTO dto = new RegistrationPreviewResponseDTO();
            dto.setRole("ADMIN");
            dto.setUserId(userId);
            dto.setEmail(user.getEmail());
            dto.setName(user.getUserName());
            dto.setStatus(UserStatus.fromCode(user.getStatus()) != null ? UserStatus.fromCode(user.getStatus()).name() : null);
            if (user.getRegistrationStatus() != null) {
                RegistrationStatus rs = RegistrationStatus.fromCode(user.getRegistrationStatus());
                dto.setStatus(rs != null ? rs.name() : dto.getStatus());
            }
            dto.setInvitedAt(user.getInvitedAt());
            dto.setRegisteredAt(user.getRegisteredAt());
            dto.setLastLoginAt(user.getLastLoginAt());
            dto.setDepartment(admin.getDepartment());
            return Result.success(dto);
        }

        return Result.error(CommonError.NOT_FOUND.getCode(), "Invalid or expired token");
    }
}
