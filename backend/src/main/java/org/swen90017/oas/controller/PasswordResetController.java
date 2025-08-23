package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.PasswordResetError;
import org.swen90017.oas.dto.request.PasswordResetRequestDTO;
import org.swen90017.oas.dto.request.PasswordResetConfirmDTO;
import org.swen90017.oas.service.PasswordResetService;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/auth/password-reset")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    @Operation(summary = "Request password reset code")
    @PostMapping("/request")
    public Result<String> requestCode(@Validated @RequestBody PasswordResetRequestDTO dto, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        passwordResetService.requestCode(dto.getEmail(), ip, ua);
        return Result.success("If an account exists, a verification code has been sent.");
    }

    @Operation(summary = "Confirm code and reset password")
    @PostMapping("/confirm")
    public ResponseEntity<Result<String>> confirm(@Validated @RequestBody PasswordResetConfirmDTO dto, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        try {
            passwordResetService.confirmAndReset(dto.getEmail(), dto.getCode(), dto.getNewPassword(), ip, ua);
            return ResponseEntity.ok(Result.success("Password has been reset successfully."));
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage();
            if ("INVALID_CODE".equals(msg)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(PasswordResetError.INVALID_CODE));
            } else if ("TOO_MANY_ATTEMPTS".equals(msg)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Result.error(PasswordResetError.TOO_MANY_ATTEMPTS));
            } else if ("WEAK_PASSWORD".equals(msg)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(PasswordResetError.WEAK_PASSWORD));
            } else if ("SAME_AS_OLD_PASSWORD".equals(msg)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(PasswordResetError.SAME_AS_OLD_PASSWORD));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Result.error(PasswordResetError.INVALID_CODE));
        }
    }
}


