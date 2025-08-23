package org.swen90017.oas.entity;

import java.util.Collection;
import java.util.Collections;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.swen90017.oas.enums.AccountStatus;


/**
 * Login user model
 */
@Data
public class LoginUser implements UserDetails {

    private static final long serialVersionUID = 1L;

    /**
     * User ID
     */
    private Long userId;

    /**
     * User email
     */
    private String email;
    /**
     * Username
     */
    private String username;

    /**
     * Password
     */
    private String password;

    /**
     * User role
     */
    private String role;

    /**
     * Account status (0-normal, 1-disabled)
     */
    private String status;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role != null) {
            return Collections.singleton(new SimpleGrantedAuthority(role));
        }
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return  AccountStatus.NORMAL.code().equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return  AccountStatus.NORMAL.code().equals(status);
    }
}

