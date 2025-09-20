package org.swen90017.oas.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.swen90017.oas.dto.profile.NotificationPreferencesDto;
import org.swen90017.oas.dto.profile.ProfileResponse;
import org.swen90017.oas.dto.profile.ProfileUserDto;
import org.swen90017.oas.dto.profile.RoleWidgetItem;
import org.swen90017.oas.dto.profile.UpdatePreferencesRequest;
import org.swen90017.oas.dto.profile.UpdateProfileRequest;
import org.swen90017.oas.entity.SysRole;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysUserRole;
import org.swen90017.oas.entity.UserNotificationPreferences;
import org.swen90017.oas.entity.UserProfile;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.mapper.RefreshTokenMapper;
import org.swen90017.oas.mapper.UserNotificationPreferencesMapper;
import org.swen90017.oas.mapper.UserProfileMapper;
import org.swen90017.oas.service.ProfileService;
import org.swen90017.oas.utils.PasswordPolicyUtils;
import org.swen90017.oas.service.ProfileWidgetService;
import org.swen90017.oas.service.ProfileWidgetService;
import org.swen90017.oas.utils.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Objects;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserNotificationPreferencesMapper preferencesMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final ProfileWidgetService profileWidgetService;
    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        UserProfile profile = userProfileMapper.selectById(userId);
        if (profile == null) {
            profile = initialiseProfile(user);
        }
        UserNotificationPreferences prefs = preferencesMapper.selectById(userId);
        if (prefs == null) {
            prefs = initialisePreferences(userId);
        }
        return buildResponse(user, profile, prefs, resolvePrimaryRole(userId));
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        UserProfile profile = userProfileMapper.selectById(userId);
        if (profile == null) {
            profile = initialiseProfile(user);
        }

        boolean dirty = false;
        if (StringUtils.isNotBlank(request.getName()) && !Objects.equals(profile.getFullName(), request.getName())) {
            profile.setFullName(request.getName());
            user.setUserName(request.getName());
            dirty = true;
        }
        if (request.getDepartment() != null && !Objects.equals(profile.getDepartment(), request.getDepartment())) {
            profile.setDepartment(request.getDepartment());
            dirty = true;
        }
        if (request.getPhone() != null && !Objects.equals(profile.getPhone(), request.getPhone())) {
            profile.setPhone(request.getPhone());
            dirty = true;
        }
        if (request.getTimezone() != null && !Objects.equals(profile.getTimezone(), request.getTimezone())) {
            profile.setTimezone(request.getTimezone());
            dirty = true;
        }
        if (request.getLanguage() != null && !Objects.equals(profile.getLanguage(), request.getLanguage())) {
            profile.setLanguage(request.getLanguage());
            dirty = true;
        }

        if (dirty) {
            profile.setUpdatedAt(LocalDateTime.now());
            profile.setCompleteness(calculateCompleteness(profile));
            userProfileMapper.updateById(profile);
            user.setUpdateTime(new java.util.Date());
            sysUserMapper.updateById(user);
        }

        UserNotificationPreferences prefs = preferencesMapper.selectById(userId);
        if (prefs == null) {
            prefs = initialisePreferences(userId);
        }

        return buildResponse(user, profile, prefs, resolvePrimaryRole(userId));
    }

    @Override
    @Transactional
    public ProfileResponse updatePreferences(Long userId, UpdatePreferencesRequest request) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        UserProfile profile = userProfileMapper.selectById(userId);
        if (profile == null) {
            profile = initialiseProfile(user);
        }
        UserNotificationPreferences prefs = preferencesMapper.selectById(userId);
        if (prefs == null) {
            prefs = initialisePreferences(userId);
        }

        if (request.getTimezone() != null && !Objects.equals(profile.getTimezone(), request.getTimezone())) {
            profile.setTimezone(request.getTimezone());
        }
        if (request.getLanguage() != null && !Objects.equals(profile.getLanguage(), request.getLanguage())) {
            profile.setLanguage(request.getLanguage());
        }
        profile.setUpdatedAt(LocalDateTime.now());
        profile.setCompleteness(calculateCompleteness(profile));
        userProfileMapper.updateById(profile);

        mapPreferencesFromRequest(prefs, request);
        prefs.setUpdatedAt(LocalDateTime.now());
        preferencesMapper.updateById(prefs);

        return buildResponse(user, profile, prefs, resolvePrimaryRole(userId));
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("USER_NOT_FOUND");
        }
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("INVALID_CREDENTIALS");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("SAME_AS_OLD_PASSWORD");
        }
        if (!PasswordPolicyUtils.isStrongPassword(newPassword)) {
            throw new IllegalArgumentException("WEAK_PASSWORD");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(new java.util.Date());
        sysUserMapper.updateById(user);
        refreshTokenMapper.revokeAllByUserId(userId);
    }

    private ProfileResponse buildResponse(SysUser user, UserProfile profile, UserNotificationPreferences prefs, String roleKey) {
        String email = StringUtils.nvl(user.getEmail(), user.getUserName());
        List<RoleWidgetItem> widgets = profileWidgetService.buildWidgets(user, roleKey);
        String displayName = profile.getFullName();
        if (StringUtils.isBlank(displayName)) {
            displayName = user.getUserName();
        }

        ProfileUserDto userDto = ProfileUserDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(displayName)
                .role(roleKey)
                .department(profile.getDepartment())
                .phone(profile.getPhone())
                .timezone(profile.getTimezone())
                .language(profile.getLanguage())
                .completeness(profile.getCompleteness())
                .lastUpdatedAt(profile.getUpdatedAt())
                .build();

        NotificationPreferencesDto preferencesDto = NotificationPreferencesDto.builder()
                .email(Boolean.TRUE.equals(prefs.getEmailEnabled()))
                .desktop(Boolean.TRUE.equals(prefs.getDesktopEnabled()))
                .bookingUpdates(Boolean.TRUE.equals(prefs.getBookingUpdates()))
                .examinerUpdates(Boolean.TRUE.equals(prefs.getExaminerUpdates()))
                .assignmentUpdates(Boolean.TRUE.equals(prefs.getAssignmentUpdates()))
                .resultUpdates(Boolean.TRUE.equals(prefs.getResultUpdates()))
                .groupUpdates(Boolean.TRUE.equals(prefs.getGroupUpdates()))
                .systemAlerts(Boolean.TRUE.equals(prefs.getSystemAlerts()))
                .build();

        return ProfileResponse.builder()
                .user(userDto)
                .preferences(preferencesDto)
                .widgets(Collections.<RoleWidgetItem>emptyList())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private UserProfile initialiseProfile(SysUser user) {
        UserProfile profile = new UserProfile();
        profile.setUserId(user.getUserId());
        profile.setFullName(user.getUserName());
        profile.setTimezone("Australia/Melbourne");
        profile.setLanguage("en");
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());
        profile.setCompleteness(calculateCompleteness(profile));
        userProfileMapper.insert(profile);
        return profile;
    }

    private UserNotificationPreferences initialisePreferences(Long userId) {
        UserNotificationPreferences prefs = new UserNotificationPreferences();
        prefs.setUserId(userId);
        prefs.setEmailEnabled(true);
        prefs.setDesktopEnabled(false);
        prefs.setBookingUpdates(true);
        prefs.setExaminerUpdates(true);
        prefs.setAssignmentUpdates(true);
        prefs.setResultUpdates(true);
        prefs.setGroupUpdates(true);
        prefs.setSystemAlerts(true);
        prefs.setUpdatedAt(LocalDateTime.now());
        preferencesMapper.insert(prefs);
        return prefs;
    }

    private void mapPreferencesFromRequest(UserNotificationPreferences prefs, UpdatePreferencesRequest request) {
        if (request.getEmail() != null) {
            prefs.setEmailEnabled(request.getEmail());
        }
        if (request.getDesktop() != null) {
            prefs.setDesktopEnabled(request.getDesktop());
        }
        if (request.getBookingUpdates() != null) {
            prefs.setBookingUpdates(request.getBookingUpdates());
        }
        if (request.getExaminerUpdates() != null) {
            prefs.setExaminerUpdates(request.getExaminerUpdates());
        }
        if (request.getAssignmentUpdates() != null) {
            prefs.setAssignmentUpdates(request.getAssignmentUpdates());
        }
        if (request.getResultUpdates() != null) {
            prefs.setResultUpdates(request.getResultUpdates());
        }
        if (request.getGroupUpdates() != null) {
            prefs.setGroupUpdates(request.getGroupUpdates());
        }
        if (request.getSystemAlerts() != null) {
            prefs.setSystemAlerts(request.getSystemAlerts());
        }
    }

    private int calculateCompleteness(UserProfile profile) {
        int total = 5;
        int filled = 0;
        if (StringUtils.isNotBlank(profile.getFullName())) {
            filled++;
        }
        if (StringUtils.isNotBlank(profile.getDepartment())) {
            filled++;
        }
        if (StringUtils.isNotBlank(profile.getPhone())) {
            filled++;
        }
        if (StringUtils.isNotBlank(profile.getTimezone())) {
            filled++;
        }
        if (StringUtils.isNotBlank(profile.getLanguage())) {
            filled++;
        }
        return Math.round((filled / (float) total) * 100);
    }

    private String resolvePrimaryRole(Long userId) {
        SysUserRole userRole = sysUserRoleMapper.selectByUserId(userId);
        if (userRole == null) {
            return null;
        }
        SysRole role = sysRoleMapper.selectById(userRole.getRoleId());
        return role != null ? role.getRoleKey() : null;
    }
}





