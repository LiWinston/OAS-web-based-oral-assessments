package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.LoginResponseDTO;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.LoginUser;

/**
 * User service interface
 */
public interface ISysUserService {
    /**
     * Find user by username
     * 
     * @param username Username
     * @return User information
     */
    SysUser selectUserByUserName(String username);
    
    /**
     * User login
     * 
     * @param username Username
     * @param password Password
     * @return Login response data
     */
    LoginResponseDTO login(String username, String password);
    
    /**
     * Get login user entity
     * 
     * @param username Username
     * @param password Password
     * @return Login user entity
     */
    LoginUser getLoginUser(String username, String password);
}
