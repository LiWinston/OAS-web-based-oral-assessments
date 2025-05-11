package org.swen90017.oas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.SecurityError;
import org.swen90017.oas.dto.request.RefreshTokenRequestDTO;
import org.swen90017.oas.dto.response.TokenResponseDTO;
import org.swen90017.oas.service.TokenService;

import java.util.Map;

/**
 * Token controller
 */
@RestController
@RequestMapping("/token")
public class TokenController {

    @Autowired
    private TokenService tokenService;

    /**
     * Refresh access token
     */
    @PostMapping("/refresh")
    public Result<TokenResponseDTO> refreshToken(@RequestBody RefreshTokenRequestDTO requestDTO) {
        try {
            // Validate and refresh token
            Map<String, String> tokens = tokenService.refreshTokens(requestDTO.getRefreshToken());
            
            // Create response
            TokenResponseDTO response = new TokenResponseDTO();
            response.setAccessToken(tokens.get("accessToken"));
            response.setRefreshToken(tokens.get("refreshToken"));
            response.setTokenType("Bearer");
            response.setExpiresIn(tokenService.getAccessTokenExpireTime());
            
            return Result.success(response);
        } catch (IllegalArgumentException e) {
            return Result.error(SecurityError.INVALID_TOKEN);
        } catch (Exception e) {
            return Result.error(SecurityError.INVALID_TOKEN.getCode(), e.getMessage());
        }
    }
} 