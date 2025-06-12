package org.swen90017.oas.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 * Handles cross-origin requests for frontend-backend separation.
 *
 * @author Yun
 */
@Configuration
public class CorsConfig {

    /**
     * Allowed frontend origins (comma-separated)
     * Defaults to common development environment URLs if not specified.
     */
    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001}")
    private String allowedOrigins;

    /**
     * Allowed HTTP methods.
     */
    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD}")
    private String allowedMethods;

    /**
     * Allowed request headers.
     */
    @Value("${cors.allowed-headers:Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-Trace-ID,X-CSRF-TOKEN}")
    private String allowedHeaders;

    /**
     * Response headers exposed to the frontend.
     */
    @Value("${cors.exposed-headers:Authorization,Content-Disposition,X-Trace-ID,Access-Control-Allow-Origin,Access-Control-Allow-Credentials}")
    private String exposedHeaders;

    /**
     * Max age (in seconds) for caching preflight requests.
     * Default: 1 hour.
     */
    @Value("${cors.max-age:3600}")
    private Long maxAge;

    /**
     * Whether to allow credentials (e.g., cookies, Authorization headers).
     */
    @Value("${cors.allow-credentials:true}")
    private Boolean allowCredentials;

    /**
     * CORS configuration source bean.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Set allowed origins
        if ("*".equals(allowedOrigins.trim())) {
            // Note: If allowCredentials is true, "*" is not allowed for allowedOrigins
            if (allowCredentials) {
                configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
            } else {
                configuration.setAllowedOrigins(Collections.singletonList("*"));
            }
        } else {
            List<String> origins = Arrays.asList(allowedOrigins.split(","));
            origins.replaceAll(String::trim);
            configuration.setAllowedOrigins(origins);
        }

        // Set allowed HTTP methods
        List<String> methods = Arrays.asList(allowedMethods.split(","));
        methods.replaceAll(String::trim);
        configuration.setAllowedMethods(methods);

        // Set allowed request headers
        List<String> headers = Arrays.asList(allowedHeaders.split(","));
        headers.replaceAll(String::trim);
        configuration.setAllowedHeaders(headers);

        // Set exposed response headers
        List<String> exposedHeadersList = Arrays.asList(exposedHeaders.split(","));
        exposedHeadersList.replaceAll(String::trim);
        configuration.setExposedHeaders(exposedHeadersList);

        // Allow credentials
        configuration.setAllowCredentials(allowCredentials);

        // Set max age for preflight cache
        configuration.setMaxAge(maxAge);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * CORS过滤器Bean
     * 在Spring Security之外提供额外的CORS支持层
     */
    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
} 