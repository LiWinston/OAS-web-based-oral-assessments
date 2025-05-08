package org.swen90017.oas.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.swen90017.oas.constant.Constants;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.service.ISysUserService;
import org.swen90017.oas.service.TokenService;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * JWT token authentication filter
 * @author: Yun Chen
 */
public class JwtAuthenticationTokenFilter extends OncePerRequestFilter {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ISysUserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // Get current request path
        String requestURI = request.getRequestURI();
        
        // Skip validation for token refresh request
        if (requestURI.equals("/token/refresh")) {
            chain.doFilter(request, response);
            return;
        }

        // Skip validation for token refresh request
        if (requestURI.equals("/deploy-time")) {
            chain.doFilter(request, response);
            return;
        }
        
        // Get Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith(Constants.TOKEN_PREFIX)) {
            // Remove "Bearer " prefix
            String token = authHeader.substring(Constants.TOKEN_PREFIX.length());
            
            try {
                // Validate token type
                if (!tokenService.validateTokenAndType(token, Constants.TOKEN_TYPE_ACCESS)) {
                    // If not an access token, continue filter chain
                    chain.doFilter(request, response);
                    return;
                }
                
                // Parse JWT token
                Claims claims = tokenService.parseToken(token);
                
                if (claims != null) {
                    // Get user ID and username from claims
                    Long userId = Long.valueOf(claims.get(Constants.JWT_USERID).toString());
                    String username = claims.getSubject();
                    
                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        // Load user details
                        LoginUser loginUser = new LoginUser();
                        loginUser.setUserId(userId);
                        loginUser.setUsername(username);
                        
                        // Create authentication
                        UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(loginUser, null, loginUser.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        
                        // Set authentication in context
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (ExpiredJwtException e) {
                logger.error("Token expired", e);
            } catch (Exception e) {
                logger.error("Cannot set user authentication", e);
            }
        }
        
        chain.doFilter(request, response);
    }
} 