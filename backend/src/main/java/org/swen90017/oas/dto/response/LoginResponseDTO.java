package org.swen90017.oas.dto.response;

import lombok.Data;
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