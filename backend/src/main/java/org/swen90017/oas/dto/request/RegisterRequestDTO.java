package org.swen90017.oas.dto.request;

import lombok.Data;

import java.io.Serializable;
@Data
public class RegisterRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * token
     */
    private String token;
    /**
     * Password
     */
    private String password;
}
