package org.swen90017.oas.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.swen90017.oas.security.XSSFilter;
import org.swen90017.oas.security.DuplicateSubmissionFilter;


@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .httpBasic(Customizer.withDefaults())
                // Add XSS filter before the security interceptor
                .addFilterBefore(new XSSFilter(), org.springframework.security.web.access.intercept.FilterSecurityInterceptor.class)
                // Add duplicate submission filter before the security interceptor
                .addFilterBefore(new DuplicateSubmissionFilter(), org.springframework.security.web.access.intercept.FilterSecurityInterceptor.class);
        return http.build();
    }
}
