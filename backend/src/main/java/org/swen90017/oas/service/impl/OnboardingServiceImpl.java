package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.response.OnboardingVerifyResponse;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.RegistrationStatus;
import org.swen90017.oas.mapper.SysAdminMapper;
import org.swen90017.oas.mapper.SysStudentMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.OnboardingService;

@Service
public class OnboardingServiceImpl implements OnboardingService {

    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysAdminMapper adminMapper;
    @Autowired
    private SysStudentMapper studentMapper;

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
}


