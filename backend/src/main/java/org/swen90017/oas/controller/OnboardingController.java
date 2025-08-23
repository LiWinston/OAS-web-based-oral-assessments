package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.dto.response.OnboardingVerifyResponse;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.service.ISysUserService;
import org.swen90017.oas.service.OnboardingService;
import org.swen90017.oas.service.StudentService;

@RestController
@RequestMapping("/onboarding")
public class OnboardingController {
    @Autowired
    StudentService studentService;
    @Autowired
    private ISysUserService userService;
    @Autowired
    private OnboardingService onboardingService;

    @GetMapping("/verify")
    @Operation(summary = "Verify onboarding token", description = "Verifies the provided onboarding token and returns the result.")
    public Result<OnboardingVerifyResponse> verify(@RequestParam("token") String token) {
        OnboardingVerifyResponse response = onboardingService.verify(token);
        if (response.isSuccess()) {
            return Result.success(response);
        } else {
            String status = response.getStatus();
            String message = response.getMessage() != null ? response.getMessage() : "Invalid token";
            return Result.error(CommonError.NOT_FOUND.getCode(), status != null ? message : "Invalid or expired token");
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Registers a new user using the provided registration details.")
    public Result<LoginResponseDTO> register(@Validated @RequestBody RegisterRequestDTO requestDTO) {
        SysUser user = studentService.registerStudent(requestDTO.getPassword(), requestDTO.getToken());
        LoginResponseDTO response = userService.login(user.getEmail(), requestDTO.getPassword());
        return Result.success(response);
    }
}
