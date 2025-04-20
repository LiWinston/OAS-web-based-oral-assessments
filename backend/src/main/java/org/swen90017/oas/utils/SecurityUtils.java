package org.swen90017.oas.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.swen90017.oas.entity.LoginUser;

/**
 * Security service tool class
 */
public class SecurityUtils {
    /**
     * Get login user information
     */
    public static LoginUser getLoginUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof LoginUser) {
                return (LoginUser) authentication.getPrincipal();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Get username
     */
    public static String getUsername() {
        LoginUser loginUser = getLoginUser();
        return loginUser == null ? "" : loginUser.getUsername();
    }

    /**
     * Get user role
     */
    public static String getUserRole() {
        LoginUser loginUser = getLoginUser();
        return loginUser == null ? "" : loginUser.getRole();
    }

    /**
     * Encrypt the password
     */
    public static String encryptPassword(String password) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return passwordEncoder.encode(password);
    }

    /**
     * Password match
     */
    public static boolean matchesPassword(String rawPassword, String encodedPassword) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
} 