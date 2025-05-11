package org.swen90017.oas.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.swen90017.oas.constant.Constants;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.entity.RefreshToken;
import org.swen90017.oas.mapper.RefreshTokenMapper;

import javax.annotation.PostConstruct;
import javax.crypto.SecretKey;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Token service for JWT generation and validation
 */
@Component
public class TokenService {

    @Autowired
    private RefreshTokenMapper refreshTokenMapper;

    /**
     * Token secret key
     */
    @Value("${token.secret}")
    private String secret;

    /**
     * Access token validity period (in minutes)
     */
    @Value("${token.expireTime}")
    private int accessTokenExpireTime;
    
    /**
     * Refresh token validity period (in days)
     */
    @Value("${token.refreshExpireTime:30}")
    private int refreshTokenExpireDays;

    private SecretKey key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    /**
     * Create access token
     */
    public String createAccessToken(LoginUser loginUser) {
        String token = UUID.randomUUID().toString();
        
        // Set user information in claims
        Map<String, Object> claims = new HashMap<>();
        claims.put(Constants.LOGIN_USER_KEY, token);
        claims.put(Constants.JWT_USERID, loginUser.getUserId());
        claims.put(Constants.JWT_USERNAME, loginUser.getUsername());
        claims.put(Constants.JWT_TOKEN_TYPE, Constants.TOKEN_TYPE_ACCESS);
        
        // Generate JWT token using java.time API for time calculation
        LocalDateTime expiryDateTime = LocalDateTime.now().plusMinutes(accessTokenExpireTime);
        return createToken(claims, expiryDateTime);
    }
    
    /**
     * Create refresh token
     */
    public RefreshToken createRefreshToken(LoginUser loginUser) {
        // First revoke all existing refresh tokens for this user
        refreshTokenMapper.revokeAllByUserId(loginUser.getUserId());

        // Create JWT claims
        Map<String, Object> claims = new HashMap<>();
        claims.put(Constants.JWT_USERID, loginUser.getUserId());
        claims.put(Constants.JWT_USERNAME, loginUser.getUsername());
        claims.put(Constants.JWT_TOKEN_TYPE, Constants.TOKEN_TYPE_REFRESH);
        
        // Calculate expiry time
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryDateTime = now.plusDays(refreshTokenExpireDays);
        
        // Create RefreshToken entity
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(loginUser.getUserId());
        refreshToken.setToken(createToken(claims, expiryDateTime));
        refreshToken.setIssuedTime(convertToDate(now));
        refreshToken.setExpiryTime(convertToDate(expiryDateTime));
        refreshToken.setRevoked(false);
        
        // Save to database
        refreshTokenMapper.insert(refreshToken);
        
        return refreshToken;
    }
    
    /**
     * Refresh access token
     */
    public Map<String, String> refreshTokens(String refreshToken) {
        // Parse refresh token
        Claims claims = parseToken(refreshToken);
        
        // Validate token type
        String tokenType = claims.get(Constants.JWT_TOKEN_TYPE, String.class);
        if (!Constants.TOKEN_TYPE_REFRESH.equals(tokenType)) {
            throw new IllegalArgumentException("Invalid token type: " + tokenType);
        }
        
        // Query token from database
        RefreshToken storedToken = refreshTokenMapper.findByToken(refreshToken);
        if (storedToken == null || storedToken.isExpired() || storedToken.getRevoked()) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        
        // Get user information
        Long userId = claims.get(Constants.JWT_USERID, Long.class);
        String username = claims.getSubject();
        
        // Create LoginUser object
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(userId);
        loginUser.setUsername(username);
        
        // Generate new access token
        String newAccessToken = createAccessToken(loginUser);
        
        // Return new tokens
        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", newAccessToken);
        tokens.put("refreshToken", refreshToken);
        
        return tokens;
    }
    
    /**
     * Parse user information from token
     */
    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * Validate token and check type
     */
    public boolean validateTokenAndType(String token, String expectedType) {
        try {
            Claims claims = parseToken(token);
            String tokenType = claims.get(Constants.JWT_TOKEN_TYPE, String.class);
            return expectedType.equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Revoke all refresh tokens for a user
     */
    public void revokeAllRefreshTokens(Long userId) {
        refreshTokenMapper.revokeAllByUserId(userId);
    }
    
    /**
     * Generate JWT token from claims with expiry date
     */
    private String createToken(Map<String, Object> claims, LocalDateTime expiryDateTime) {
        LocalDateTime now = LocalDateTime.now();
        
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(convertToDate(now))
                .setExpiration(convertToDate(expiryDateTime))
                .signWith(key,SignatureAlgorithm.HS512)
                .compact();
    }

    //TODO: move to DateUtils
    /**
     * Convert LocalDateTime to java.util.Date
     */
    private Date convertToDate(LocalDateTime localDateTime) {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    public Long getAccessTokenExpireTime() {
        return (long) accessTokenExpireTime * 60;
    }
}