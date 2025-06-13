package org.swen90017.oas.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

/**
 * Global CORS filter that runs with highest priority
 * This ensures CORS headers are added to all responses
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalCorsFilter extends OncePerRequestFilter {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalCorsFilter.class);
    
    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;
    
    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD}")
    private String allowedMethods;
    
    @Value("${cors.allowed-headers:Content-Type,Authorization,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-Trace-ID,X-CSRF-TOKEN}")
    private String allowedHeaders;
    
    @Value("${cors.exposed-headers:Authorization,Content-Disposition,X-Trace-ID}")
    private String exposedHeaders;
    
    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;
    
    @Value("${cors.max-age:3600}")
    private long maxAge;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String origin = request.getHeader("Origin");
        
        // Log CORS request
        log.debug("Processing request: {} {} with origin: {}", request.getMethod(), request.getRequestURI(), origin);
        
        // Always add CORS headers - even if no Origin header present
        // This helps with testing and some client scenarios
        if ("*".equals(allowedOrigins.trim())) {
            if (origin != null) {
                response.setHeader("Access-Control-Allow-Origin", origin);
            } else {
                response.setHeader("Access-Control-Allow-Origin", "*");
            }
        } else {
            // Check if origin is in allowed list
            if (origin != null && Arrays.asList(allowedOrigins.split(",")).contains(origin.trim())) {
                response.setHeader("Access-Control-Allow-Origin", origin);
            } else if (origin == null) {
                // If no origin header, allow first origin from the list for testing
                String firstAllowedOrigin = allowedOrigins.split(",")[0].trim();
                response.setHeader("Access-Control-Allow-Origin", firstAllowedOrigin);
            }
        }
        
        // Always set CORS headers regardless of Origin header presence
        response.setHeader("Access-Control-Allow-Methods", allowedMethods);
        response.setHeader("Access-Control-Allow-Headers", allowedHeaders);
        response.setHeader("Access-Control-Expose-Headers", exposedHeaders);
        response.setHeader("Access-Control-Allow-Credentials", String.valueOf(allowCredentials));
        response.setHeader("Access-Control-Max-Age", String.valueOf(maxAge));
        
        // Always set Vary headers for proper caching
        response.addHeader("Vary", "Origin");
        
        // Handle preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            log.debug("Handling OPTIONS preflight request");
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        
        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
} 