package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.response.OnboardingVerifyResponse;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.enums.UserStatus;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.ExaminerMapper;
import org.swen90017.oas.mapper.SysAdminMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.OnboardingService;

import java.util.List;

@Service
public class OnboardingServiceImpl implements OnboardingService {

    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysAdminMapper adminMapper;
    @Autowired
    private SysStudentMapper studentMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AssignmentParticipantMapper assignmentParticipantMapper;
    @Autowired
    private ExaminerMapper examinerMapper;

    @Override
    public OnboardingVerifyResponse verify(String token) {
        OnboardingVerifyResponse resp = new OnboardingVerifyResponse();

        // 1) Student token
        SysStudent student = studentMapper.selectOne(new QueryWrapper<SysStudent>().eq("token", token));
        if (student != null) {
            SysUser user = userMapper.selectById(student.getUserId());
            if (user == null) {
                // 数据不一致，视为 invalid
                resp.setSuccess(false);
                resp.setStatus("invalid");
                resp.setMessage("Invalid link");
                return resp;
            }
            RegistrationStatus r = RegistrationStatus.fromCode(user.getRegistrationStatus());
            if (r == RegistrationStatus.EXPIRED) {
                resp.setSuccess(false);
                resp.setStatus("expired");
                resp.setMessage("Link expired");
                return resp;
            }

            resp.setSuccess(true);
            resp.setStatus("valid");
            resp.setAlreadyRegistered(r == RegistrationStatus.REGISTERED);
            resp.setRole("STUDENT");
            resp.setEmail(user.getEmail());
            resp.setFullName(user.getUserName());

            // 课程/作业上下文：当前后端暂无课程/作业实体，留空占位
            // 可在将来通过关联查询填充
            return resp;
        }
        // 2) Examiner token
        SysExaminer examiner = examinerMapper.selectOne(new QueryWrapper<SysExaminer>().eq("token", token));
        if (examiner != null) {
            SysUser user = userMapper.selectById(examiner.getUserId());
            if (user == null) {
                resp.setSuccess(false);
                resp.setStatus("invalid");
                resp.setMessage("Invalid link");
                return resp;
            }
            RegistrationStatus r = RegistrationStatus.fromCode(user.getRegistrationStatus());
            if (r == RegistrationStatus.EXPIRED) {
                resp.setSuccess(false);
                resp.setStatus("expired");
                resp.setMessage("Link expired");
                return resp;
            }

            resp.setSuccess(true);
            resp.setStatus("valid");
            resp.setAlreadyRegistered(r == RegistrationStatus.REGISTERED);
            resp.setRole("EXAMINER");
            resp.setEmail(user.getEmail());
            resp.setFullName(user.getUserName());

            // 课程/作业上下文：当前后端暂无课程/作业实体，留空占位
            return resp;
        }

        // 3) Admin token
        SysAdmin admin = adminMapper.selectOne(new QueryWrapper<SysAdmin>().eq("token", token));
        if (admin != null) {
            SysUser user = userMapper.selectById(admin.getUserId());
            if (user == null) {
                resp.setSuccess(false);
                resp.setStatus("invalid");
                resp.setMessage("Invalid link");
                return resp;
            }
            RegistrationStatus r = RegistrationStatus.fromCode(user.getRegistrationStatus());
            if (r == RegistrationStatus.EXPIRED) {
                resp.setSuccess(false);
                resp.setStatus("expired");
                resp.setMessage("Link expired");
                return resp;
            }

            resp.setSuccess(true);
            resp.setStatus("valid");
            resp.setAlreadyRegistered(r == RegistrationStatus.REGISTERED);
            resp.setRole("COURSE_ADMIN");
            resp.setEmail(user.getEmail());
            resp.setFullName(user.getUserName());
            resp.setDepartment(admin.getDepartment());
            return resp;
        }

        // 4) No match
        resp.setSuccess(false);
        resp.setStatus("invalid");
        resp.setMessage("Invalid or expired token");
        return resp;
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
            //TODO:这里的逻辑需要讨论
            List<AssignmentParticipant> participant = assignmentParticipantMapper.selectList(
                    new QueryWrapper<AssignmentParticipant>().eq("user_id", user.getUserId())
            );
            participant.forEach(p -> {
                p.setIfJoin(0);
                assignmentParticipantMapper.updateById(p);
            });
            return user;
        }
        // 2) Try examiner
        SysExaminer examiner = examinerMapper.selectOne(new QueryWrapper<SysExaminer>().eq("token", token));
        if (examiner != null) {
            SysUser user = userMapper.selectById(examiner.getUserId());
            if (user == null) throw new BusinessException(BusinessError.USER_NOT_FOUND);
            user.setStatus(UserStatus.ACTIVE.code());
            user.setRegistrationStatus(RegistrationStatus.REGISTERED.code());
            user.setRegisteredAt(new java.util.Date());
            user.setPassword(passwordEncoder.encode(rawPassword));
            userMapper.updateById(user);
            // 与学生一致：标记所有关联的 assignment 参与记录为未确认/未加入（ifJoin=0）
            List<AssignmentParticipant> participant = assignmentParticipantMapper.selectList(
                    new QueryWrapper<AssignmentParticipant>().eq("user_id", user.getUserId())
            );
            participant.forEach(p -> {
                p.setIfJoin(0);
                assignmentParticipantMapper.updateById(p);
            });
            return user;
        }
        // 3) Try admin
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

        // 4) Not found
        throw new BusinessException("Invalid registration link or token has expired");
    }
}


