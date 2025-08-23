package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.entity.PasswordResetCode;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.enums.UserRole;
import org.swen90017.oas.entity.SysUserRole;
import org.swen90017.oas.entity.SysRole;
import org.swen90017.oas.mapper.PasswordResetCodeMapper;
import org.swen90017.oas.mapper.RefreshTokenMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.service.PasswordResetService;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Random;

@Service
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    @Autowired
    private SysUserMapper userMapper;
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    @Autowired
    private PasswordResetCodeMapper codeMapper;
    @Autowired
    private RefreshTokenMapper refreshTokenMapper;
    @Autowired
    private EmailService emailService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SysRoleMapper roleMapper;

    @Value("${password.reset.ttlMinutes:10}")
    private int ttlMinutes;

    @Value("${password.reset.maxAttempts:5}")
    private int maxAttempts;

    @Value("${password.reset.resendCooldownSeconds:60}")
    private int resendCooldownSeconds;

    private String generateNumericCode(int length) {
        Random random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes());
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                String s = Integer.toHexString(b & 0xff);
                if (s.length() == 1) hex.append('0');
                hex.append(s);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (Character.isLetter(c)) hasLetter = true;
            if (Character.isDigit(c)) hasDigit = true;
            if (hasLetter && hasDigit) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional
    public void requestCode(String email, String ip, String userAgent) {
        if (email == null || email.isEmpty()) {
            return; // enumeration-safe
        }
        SysUser user = userMapper.selectOne(new QueryWrapper<SysUser>().eq("email", email));
        if (user == null) {
            return; // enumeration-safe
        }

        // Disallow SUPER_ADMIN
        SysUserRole userRole = userRoleMapper.selectByUserId(user.getUserId());
        if (userRole != null) {
            SysRole role = roleMapper.selectById(userRole.getRoleId());
            if (role != null && UserRole.SUPER_ADMIN.code().equals(role.getRoleKey())) {
                return; // respond 200 but no-op
            }
        }

        PasswordResetCode latest = codeMapper.findLatestActiveByUserId(user.getUserId());
        if (latest != null && latest.getLastSentAt() != null) {
            long secondsSinceLast = (Instant.now().toEpochMilli() - latest.getLastSentAt().getTime()) / 1000;
            if (secondsSinceLast < resendCooldownSeconds) {
                // throttle silently
                return;
            }
        }

        // Rotate any existing active code by marking used
        if (latest != null && latest.getUsedAt() == null) {
            codeMapper.markUsed(latest.getId());
        }

        String code = generateNumericCode(6);
        String codeHash = sha256Hex(code);
        Date now = new Date();
        Date expiresAt = Date.from(Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES));

        PasswordResetCode prc = new PasswordResetCode();
        prc.setUserId(user.getUserId());
        prc.setCodeHash(codeHash);
        prc.setAttemptCount(0);
        prc.setCreatedAt(now);
        prc.setLastSentAt(now);
        prc.setExpiresAt(expiresAt);
        prc.setCreatedIp(ip);
        prc.setUserAgent(userAgent);
        codeMapper.insert(prc);

        // Send email
        emailService.sendPasswordResetCode(user, code, ttlMinutes);
    }

    @Override
    @Transactional
    public void confirmAndReset(String email, String code, String newPassword, String ip, String userAgent) {
        if (email == null || code == null || newPassword == null) {
            throw new IllegalArgumentException("Invalid payload");
        }
        SysUser user = userMapper.selectOne(new QueryWrapper<SysUser>().eq("email", email));
        if (user == null) {
            throw new IllegalArgumentException("INVALID_CODE");
        }

        PasswordResetCode latest = codeMapper.findLatestActiveByUserId(user.getUserId());
        if (latest == null || latest.getUsedAt() != null || latest.getExpiresAt().before(new Date())) {
            throw new IllegalArgumentException("INVALID_CODE");
        }

        // Check attempts
        if (latest.getAttemptCount() != null && latest.getAttemptCount() >= maxAttempts) {
            codeMapper.markUsed(latest.getId());
            throw new IllegalArgumentException("TOO_MANY_ATTEMPTS");
        }

        String inputHash = sha256Hex(code);
        if (!constantTimeEquals(inputHash, latest.getCodeHash())) {
            latest.setAttemptCount((latest.getAttemptCount() == null ? 0 : latest.getAttemptCount()) + 1);
            codeMapper.updateById(latest);
            throw new IllegalArgumentException("INVALID_CODE");
        }

        // Validate new password different from current and meets policy
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new IllegalArgumentException("SAME_AS_OLD_PASSWORD");
        }
        if (!isStrongPassword(newPassword)) {
            throw new IllegalArgumentException("WEAK_PASSWORD");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);

        // Mark used
        codeMapper.markUsed(latest.getId());

        // Revoke refresh tokens
        refreshTokenMapper.revokeAllByUserId(user.getUserId());
    }
}


