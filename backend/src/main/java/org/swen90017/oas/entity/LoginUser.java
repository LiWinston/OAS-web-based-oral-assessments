package org.swen90017.oas.entity;

import java.io.Serializable;
import lombok.Data;

/**
 * Login user model
 */
@Data
public class LoginUser implements Serializable {
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
} 