package org.swen90017.oas.controller;

import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.profile.ProfileResponse;
import org.swen90017.oas.dto.profile.UpdatePreferencesRequest;
import org.swen90017.oas.dto.profile.UpdateProfileRequest;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.ProfileService;
import org.swen90017.oas.utils.SecurityUtils;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Result<ProfileResponse>> getCurrentProfile() {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        ProfileResponse response = profileService.getCurrentProfile(loginUser.getUserId());
        return ResponseEntity.ok(Result.success(response));
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Result<ProfileResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        ProfileResponse response = profileService.updateProfile(loginUser.getUserId(), request);
        return ResponseEntity.ok(Result.success(response));
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Result<ProfileResponse>> updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        ProfileResponse response = profileService.updatePreferences(loginUser.getUserId(), request);
        return ResponseEntity.ok(Result.success(response));
    }
}
