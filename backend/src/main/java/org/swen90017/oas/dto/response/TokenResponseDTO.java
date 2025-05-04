package org.swen90017.oas.dto.response;

import lombok.Data;
import java.io.Serializable;

/**
 * Token response DTO
 */
@Data
public class TokenResponseDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
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