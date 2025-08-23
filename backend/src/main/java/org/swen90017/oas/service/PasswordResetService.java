package org.swen90017.oas.service;

/**
 * Service for issuing and verifying password reset codes
 */
public interface PasswordResetService {
    void requestCode(String email, String ip, String userAgent);
    void confirmAndReset(String email, String code, String newPassword, String ip, String userAgent);
}


