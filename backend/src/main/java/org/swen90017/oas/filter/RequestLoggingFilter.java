package org.swen90017.oas.filter;

import java.io.IOException;
import java.util.UUID;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.ServletUtils;

/**
 * Global request logging filter
 *
 * @author Yongchun Li
 */
@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    
    /**
     * Request ID header name
     */
    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Record request start time
        long startTime = System.currentTimeMillis();
        
        // Generate request ID
        String requestId = generateRequestId();
        
        // Add request ID to response header
        response.setHeader(REQUEST_ID_HEADER, requestId);
        
        try {
            // Record request log
            logRequestDetails(request, requestId);
            
            // Continue processing the request
            filterChain.doFilter(request, response);
        } finally {
            // Calculate request processing time
            long duration = System.currentTimeMillis() - startTime;
            
            // Record response log
            logResponseDetails(request, response, duration, requestId);
        }
    }
    
    /**
     * Generate unique request ID
     *
     * @return Request ID
     */
    private String generateRequestId() {
        return UUID.randomUUID().toString().replace("-", "");
    }
    
    /**
     * Record request details
     *
     * @param request   Request
     * @param requestId Request ID
     */
    private void logRequestDetails(HttpServletRequest request, String requestId) {
        try {
            // Record request information
            String method = request.getMethod();
            String uri = request.getRequestURI();
            String queryString = request.getQueryString();
            String client = IpUtils.getIpAddr(request);
            String userAgent = request.getHeader("User-Agent");
            
            // Build request URL
            String url = uri + (queryString != null ? "?" + queryString : "");
            
            // Output request log
            StringBuilder logBuilder = new StringBuilder();
            logBuilder.append("\n=== Request Start ===\n");
            logBuilder.append("Request ID: ").append(requestId).append("\n");
            logBuilder.append("Method: ").append(method).append("\n");
            logBuilder.append("URL: ").append(url).append("\n");
            logBuilder.append("Client IP: ").append(client).append("\n");
            logBuilder.append("User-Agent: ").append(userAgent).append("\n");
            
            // Record request headers (optional, can be commented out if the information volume is too large)
            // logBuilder.append("Headers: ").append(StringUtils.toJsonString(ServletUtils.getHeaderMap(request))).append("\n");
            
            // If it's a GET request, record request parameters
            if ("GET".equalsIgnoreCase(method)) {
                logBuilder.append("Parameters: ").append(ServletUtils.getParamMap(request)).append("\n");
            }
            
            logBuilder.append("=== Request Info End ===");
            log.info(logBuilder.toString());
        } catch (Exception e) {
            log.error("Error logging request details", e);
        }
    }
    
    /**
     * Record response details
     *
     * @param request   Request
     * @param response  Response
     * @param duration  Processing time
     * @param requestId Request ID
     */
    private void logResponseDetails(HttpServletRequest request, HttpServletResponse response, long duration, String requestId) {
        try {
            // Output response log
            StringBuilder logBuilder = new StringBuilder();
            logBuilder.append("\n=== Response Info ===\n");
            logBuilder.append("Request ID: ").append(requestId).append("\n");
            logBuilder.append("URI: ").append(request.getRequestURI()).append("\n");
            logBuilder.append("Status: ").append(response.getStatus()).append("\n");
            logBuilder.append("Duration: ").append(duration).append(" ms\n");
            logBuilder.append("=== Response End ===");
            log.info(logBuilder.toString());
        } catch (Exception e) {
            log.error("Error logging response details", e);
        }
    }
} 