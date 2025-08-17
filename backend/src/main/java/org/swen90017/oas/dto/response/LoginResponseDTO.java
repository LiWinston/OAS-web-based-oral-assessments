package org.swen90017.oas.dto.response;

import lombok.Data;
import org.swen90017.oas.entity.SysUser;

import java.io.Serializable;

/**
 * Login response DTO
 */
@Data
public class LoginResponseDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;

    /**
     * User ID
     */
    private Long userId;
    
    /**
     * Username
     */
    private String username;
    
    /**
     * User role
     */
    private String role;

    /**
     * User email
     */
    private String email;
    
    /**
     * Access token
     */
    private String accessToken;
    
    /**
     * Refresh token
     */
    private String refreshToken;
    
    /**
     * Token type
     */
    private String tokenType = "Bearer";
    
    /**
     * Access token expiration time in seconds
     */
    private Long expiresIn;
} 