package org.swen90017.oas.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.FilterSecurityInterceptor;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.swen90017.oas.filter.JwtAuthenticationTokenFilter;
import org.swen90017.oas.security.JwtAuthenticationEntryPoint;
import org.swen90017.oas.security.XSSFilter;
import org.swen90017.oas.security.DuplicateSubmissionFilter;

/**
 * Security configuration
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    /**
     * Custom user details service
     */
    @Autowired
    private UserDetailsService userDetailsService;
    
    /**
     * JWT authentication entry point
     */
    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    /**
     * Authentication manager bean
     */
    @Bean
    public AuthenticationManager authenticationManagerBean(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }

    /**
     * Password encoder bean
     */
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    
    /**
     * JWT authentication filter bean
     */
    @Bean
    public JwtAuthenticationTokenFilter authenticationTokenFilter() {
        return new JwtAuthenticationTokenFilter();
    }

    /**
     * Security filter chain configuration
     */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      http
          // Disable CSRF for REST API
          .csrf(csrf -> csrf.disable())

          // Exception handling
          .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

          // Stateless session management
          .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

          // Request authorization
          .authorizeHttpRequests(auth -> auth
              // Public endpoints
              .antMatchers("/login", "/register").permitAll()
              .antMatchers(HttpMethod.POST, "/token/refresh").permitAll()
              .antMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
              .antMatchers(HttpMethod.GET, "/", "/*.html", "/**/*.html", "/**/*.css", "/**/*.js").permitAll()
              // Authenticated endpoints
              .anyRequest().authenticated()
          );

      // Add XSS and DuplicateSubmission filters before the security interceptor
      http.addFilterBefore(new XSSFilter(), FilterSecurityInterceptor.class);
      http.addFilterBefore(new DuplicateSubmissionFilter(), FilterSecurityInterceptor.class);

      // Add JWT filter before the UsernamePasswordAuthenticationFilter
      http.addFilterBefore(authenticationTokenFilter(), UsernamePasswordAuthenticationFilter.class);

      return http.build();
  }

}
