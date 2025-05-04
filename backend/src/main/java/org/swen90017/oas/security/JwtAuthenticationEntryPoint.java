package org.swen90017.oas.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.common.SecurityError;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.Serializable;

/**
 * JWT authentication entry point for handling unauthorized requests
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint, Serializable {

    private static final long serialVersionUID = 1L;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // Set response status
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json;charset=UTF-8");
        
        // Create error response based on exception type
        Result<Void> error;
        
        if (authException instanceof BadCredentialsException) {
            error = Result.error(SecurityError.INVALID_CREDENTIALS);
        } else if (authException instanceof InsufficientAuthenticationException) {
            error = Result.error(SecurityError.MISSING_TOKEN);
        } else {
            error = Result.error(SecurityError.INVALID_TOKEN.getCode(), 
                    "Unauthorized: " + authException.getMessage());
        }
        
        // Write error response
        ObjectMapper objectMapper = new ObjectMapper();
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
} 