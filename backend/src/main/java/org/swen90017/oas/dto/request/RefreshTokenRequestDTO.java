package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * Refresh token request DTO
 */
@Data
public class RefreshTokenRequestDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Refresh token
     */
    @NotBlank(message = "refresh_token cannot be empty")
    private String refreshToken;
} 