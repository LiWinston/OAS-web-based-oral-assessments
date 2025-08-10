package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.CommonError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.request.LoginRequestDTO;
import org.swen90017.oas.dto.request.RefreshTokenRequestDTO;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.service.ISysUserService;
import org.swen90017.oas.service.TokenService;

/**
 * Login controller
 */
@RestController
public class LoginController {

    @Autowired
    private ISysUserService userService;
    @Autowired
    private TokenService tokenService;

    
    /**
     * User login
     */
    @PostMapping("/login")
    public Result<LoginResponseDTO> login(@Validated @RequestBody LoginRequestDTO loginRequest) {
        try {
            // Process login and get response data directly from service
            LoginResponseDTO response = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            
            return Result.success(response);
        } catch (UsernameNotFoundException e) {
            return Result.error(SecurityError.INVALID_CREDENTIALS);
        } catch (BadCredentialsException e) {
            if (e.getMessage().contains("disabled")) {
                return Result.error(SecurityError.ACCOUNT_DISABLED);
            } else {
                return Result.error(SecurityError.INVALID_CREDENTIALS);
            }
        } catch (Exception e) {
            return Result.error(CommonError.SERVER_ERROR.getCode(), e.getMessage());
        }
    }
    /**
     * Logout: revoke the provided refresh token.
     */
    @PostMapping("/logout")
    public Result logout(@RequestBody RefreshTokenRequestDTO requestDTO) {
        try {
            String token = null;
            if (requestDTO != null && requestDTO.getRefreshToken() != null && !requestDTO.getRefreshToken().isEmpty()) {
                token = requestDTO.getRefreshToken();
            }
            if (token == null ) {
                return Result.error(SecurityError.INVALID_TOKEN);
            }

            tokenService.revokeRefreshToken(token,requestDTO.getUserId());
            return Result.success();
        } catch (Exception e) {
            return Result.error(SecurityError.INVALID_TOKEN.getCode(), e.getMessage());
        }
    }
} 