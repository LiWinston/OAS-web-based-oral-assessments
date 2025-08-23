package org.swen90017.oas.dto.request;

import lombok.Data;

@Data
public class PasswordResetConfirmDTO {
    private String email;
    private String code;
    private String newPassword;
}


