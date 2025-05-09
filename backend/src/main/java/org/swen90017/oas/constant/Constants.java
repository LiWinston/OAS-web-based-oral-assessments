package org.swen90017.oas.constant;

import java.util.Locale;

import io.jsonwebtoken.Claims;

/**
 * Common Constants
 *
 * @author Yongchun Li
 */
public class Constants {
    /**
     * UTF-8 Character Set
     */
    public static final String UTF8 = "UTF-8";

    /**
     * GBK Character Set
     */
    public static final String GBK = "GBK";

    /**
     * System Language
     */
    public static final Locale DEFAULT_LOCALE = Locale.SIMPLIFIED_CHINESE;

    /**
     * WWW Domain
     */
    public static final String WWW = "www.";

    /**
     * HTTP Request
     */
    public static final String HTTP = "http://";

    /**
     * HTTPS Request
     */
    public static final String HTTPS = "https://";

    /**
     * Common Success Identifier
     */
    public static final String SUCCESS = "0";

    /**
     * Common Failure Identifier
     */
    public static final String FAIL = "1";

    /**
     * Login Success
     */
    public static final String LOGIN_SUCCESS = "Success";

    /**
     * Logout
     */
    public static final String LOGOUT = "Logout";

    /**
     * Register
     */
    public static final String REGISTER = "Register";

    /**
     * Login Failure
     */
    public static final String LOGIN_FAIL = "Error";

    /**
     * All Permissions Identifier
     */
    public static final String ALL_PERMISSION = "*:*:*";

    /**
     * Admin Role Permission Identifier
     */
    public static final String SUPER_ADMIN = "admin";

    /**
     * Role Permission Delimiter
     */
    public static final String ROLE_DELIMETER = ",";

    /**
     * Permission Identifier Delimiter
     */
    public static final String PERMISSION_DELIMETER = ",";

    /**
     * Captcha Expiration (minutes)
     */
    public static final Integer CAPTCHA_EXPIRATION = 2;

    /**
     * Token
     */
    public static final String TOKEN = "token";

    /**
     * Token Prefix
     */
    public static final String TOKEN_PREFIX = "Bearer ";

    /**
     * Login User Key
     */
    public static final String LOGIN_USER_KEY = "login_user_key";

    /**
     * User ID
     */
    public static final String JWT_USERID = "userid";

    /**
     * Username
     */
    public static final String JWT_USERNAME = Claims.SUBJECT;

    /**
     * User Avatar
     */
    public static final String JWT_AVATAR = "avatar";

    /**
     * Creation Time
     */
    public static final String JWT_CREATED = "created";

    /**
     * User Permissions
     */
    public static final String JWT_AUTHORITIES = "authorities";

    /**
     * Access Token Type
     */
    public static final String TOKEN_TYPE_ACCESS = "access";
    
    /**
     * Refresh Token Type
     */
    public static final String TOKEN_TYPE_REFRESH = "refresh";
    
    /**
     * Token Type Claim Name
     */
    public static final String JWT_TOKEN_TYPE = "token_type";

    /**
     * Resource Mapping Path Prefix
     */
    public static final String RESOURCE_PREFIX = "/profile";
}
