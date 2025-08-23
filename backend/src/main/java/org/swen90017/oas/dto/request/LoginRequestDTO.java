package org.swen90017.oas.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;

/**
 * Login request DTO
 */
@Data
public class LoginRequestDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Username
     */
    @NotBlank(message = "Email cannot be empty")
    private String email;
    
    /**
     * Password
     */
    @NotBlank(message = "Password cannot be empty")
    private String password;
} 