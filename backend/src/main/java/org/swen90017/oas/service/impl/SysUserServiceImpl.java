package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.entity.LoginUser;
import org.swen90017.oas.entity.SysRole;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysUserRole;
import org.swen90017.oas.enums.AccountStatus;
import org.swen90017.oas.mapper.SysRoleMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.SysUserRoleMapper;
import org.swen90017.oas.service.ISysUserService;
import org.swen90017.oas.utils.SecurityUtils;
import org.swen90017.oas.service.TokenService;
import org.springframework.beans.factory.annotation.Value;
import org.swen90017.oas.entity.RefreshToken;

/**
 * User service implementation
 */
@Service
public class SysUserServiceImpl implements ISysUserService {

    @Autowired
    private SysUserMapper userMapper;
    
    @Autowired
    private SysRoleMapper roleMapper;
    
    @Autowired
    private SysUserRoleMapper userRoleMapper;
    
    @Autowired
    private TokenService tokenService;

    @Value("${token.expireTime}")
    private int accessTokenExpireTime;

    /**
     * Find user by username
     *
     * @param username Username to search
     * @return User information
     */
    @Override
    public SysUser selectUserByUserName(String username) {
        return userMapper.selectByUserName(username);
    }

    public SysUser selectUserByEmail(String email){
        return userMapper.selectOne(
                new QueryWrapper<SysUser>()
                        .eq("email", email)
        );
    }

    @Override
    public void logout() {

    }

    /**
     * Get login user entity
     *
     * @param email Username
     * @param password Password
     * @return Login user entity
     */
    @Override
    public LoginUser getLoginUser(String email, String password) {
        // Find user by username
        SysUser user = selectUserByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("Username or password is incorrect");
        }
        
        // Check account status
        if (AccountStatus.BANNED.code().equals(user.getStatus())) {
            throw new BadCredentialsException("Account is disabled");
        }
        
        // Verify password
        if (!SecurityUtils.matchesPassword(password, user.getPassword())) {
            throw new BadCredentialsException("Username or password is incorrect");
        }
        
        // Get user role
        SysUserRole userRole = userRoleMapper.selectByUserId(user.getUserId());
        
        // Get role details
        SysRole role = null;
        if (userRole != null) {
            role = roleMapper.selectById(userRole.getRoleId());
        }
        
        // Build login user object
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(user.getUserId());
        loginUser.setUsername(user.getUserName());
        loginUser.setPassword(user.getPassword());
        loginUser.setStatus(user.getStatus());
        loginUser.setEmail(user.getEmail());
        if (role != null) {
            loginUser.setRole(role.getRoleKey());
        }
        
        return loginUser;
    }
    
    /**
     * User login
     *
     * @param email Username
     * @param password Password
     * @return Login response data
     */
    @Override
    public LoginResponseDTO login(String email, String password) {
        // Process login to get user information
        LoginUser loginUser = getLoginUser(email, password);
        
        // Generate access token
        String accessToken = tokenService.createAccessToken(loginUser);
        
        // Generate refresh token
        RefreshToken refreshToken = tokenService.createRefreshToken(loginUser);
        
        // Build response DTO
        LoginResponseDTO response = new LoginResponseDTO();
        response.setUserId(loginUser.getUserId());
        response.setUsername(loginUser.getUsername());
        response.setRole(loginUser.getRole());
        response.setEmail(loginUser.getEmail());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken.getToken());
        response.setExpiresIn((long) accessTokenExpireTime * 60);
        
        return response;
    }
} 