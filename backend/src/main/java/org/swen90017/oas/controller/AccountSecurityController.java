package org.swen90017.oas.controller;

import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.request.ChangePasswordRequestDTO;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.ProfileService;
import org.swen90017.oas.utils.SecurityUtils;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AccountSecurityController {

    private final ProfileService profileService;

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Result<String>> changePassword(@Valid @RequestBody ChangePasswordRequestDTO request) {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        try {
            profileService.changePassword(loginUser.getUserId(), request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok(Result.success("Password changed"));
        } catch (IllegalArgumentException ex) {
            String message = ex.getMessage();
            if ("INVALID_CREDENTIALS".equals(message)) {
                return ResponseEntity.ok(Result.error(SecurityError.INVALID_CREDENTIALS));
            }
            if ("SAME_AS_OLD_PASSWORD".equals(message)) {
                return ResponseEntity.ok(Result.error(SecurityError.INVALID_CREDENTIALS.getCode(), "SAME_AS_OLD_PASSWORD"));
            }
            if ("WEAK_PASSWORD".equals(message)) {
                return ResponseEntity.ok(Result.error(SecurityError.INVALID_CREDENTIALS.getCode(), "WEAK_PASSWORD"));
            }
            if ("USER_NOT_FOUND".equals(message)) {
                return ResponseEntity.ok(Result.error(SecurityError.INVALID_TOKEN.getCode(), "USER_NOT_FOUND"));
            }
            return ResponseEntity.ok(Result.error(SecurityError.INVALID_TOKEN.getCode(), message));
        }
    }
}
