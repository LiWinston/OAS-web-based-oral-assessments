package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.request.LoginRequestDTO;
import org.swen90017.oas.dto.request.RegisterRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.service.StudentService;

@RestController
public class RegisterController {
    @Autowired
    StudentService studentService;
    @PostMapping("/register")
    public Result login(@Validated @RequestBody RegisterRequestDTO requestDTO) {
        studentService.registerStudent(requestDTO.getPassword(), requestDTO.getToken());
        return Result.success("Register successfully");
    }
}
