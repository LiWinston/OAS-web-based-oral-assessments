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
    
    // ANSI color codes for console output
    private static final String ANSI_RESET = "\u001B[0m";
    private static final String ANSI_BOLD = "\u001B[1m";
    private static final String ANSI_RED = "\u001B[31m";
    private static final String ANSI_GREEN = "\u001B[32m";
    private static final String ANSI_YELLOW = "\u001B[33m";
    private static final String ANSI_BLUE = "\u001B[34m";
    private static final String ANSI_PURPLE = "\u001B[35m";
    private static final String ANSI_CYAN = "\u001B[36m";
    
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
            
            // Apply color to method based on HTTP method
            String coloredMethod = method;
            if ("GET".equalsIgnoreCase(method)) {
                coloredMethod = ANSI_GREEN + method + ANSI_RESET;
            } else if ("POST".equalsIgnoreCase(method)) {
                coloredMethod = ANSI_BLUE + method + ANSI_RESET;
            } else if ("PUT".equalsIgnoreCase(method)) {
                coloredMethod = ANSI_YELLOW + method + ANSI_RESET;
            } else if ("DELETE".equalsIgnoreCase(method)) {
                coloredMethod = ANSI_RED + method + ANSI_RESET;
            } else if ("PATCH".equalsIgnoreCase(method)) {
                coloredMethod = ANSI_PURPLE + method + ANSI_RESET;
            }
            
            // Output request log with decorative elements and colors
            StringBuilder logBuilder = new StringBuilder();
            String separator = ANSI_CYAN + "┌────────────────────────────────────────────────────────────────────────────────┐" + ANSI_RESET;
            String line = ANSI_CYAN + "│" + ANSI_RESET;
            String bottomSeparator = ANSI_CYAN + "└────────────────────────────────────────────────────────────────────────────────┘" + ANSI_RESET;
            
            logBuilder.append("\n").append(separator).append("\n");
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_BLUE).append("🔔 INCOMING REQUEST").append(ANSI_RESET).append(" [").append(requestId).append("]").append("\n");
            logBuilder.append(ANSI_CYAN + "├────────────────────────────────────────────────────────────────────────────────┤" + ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Method:").append(ANSI_RESET).append("    ").append(coloredMethod).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URL:").append(ANSI_RESET).append("       ").append(url).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Client IP:").append(ANSI_RESET).append(" ").append(client).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("User-Agent:").append(ANSI_RESET).append(" ").append(userAgent).append("\n");
            
            // If it's a GET request, record request parameters
            if ("GET".equalsIgnoreCase(method)) {
                logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Parameters:").append(ANSI_RESET).append(" ").append(ServletUtils.getParamMap(request)).append("\n");
            }
            
            logBuilder.append(bottomSeparator);
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
            // Get status color based on response status
            String statusColor = ANSI_GREEN;
            int status = response.getStatus();
            if (status >= 400 && status < 500) {
                statusColor = ANSI_YELLOW;
            } else if (status >= 500) {
                statusColor = ANSI_RED;
            }
            
            // Format duration with color based on response time
            String durationColor = ANSI_GREEN;
            if (duration > 500) {
                durationColor = ANSI_YELLOW;
            } else if (duration > 2000) {
                durationColor = ANSI_RED;
            }
            
            // Output response log with decorative elements and colors
            StringBuilder logBuilder = new StringBuilder();
            String separator = ANSI_PURPLE + "┌────────────────────────────────────────────────────────────────────────────────┐" + ANSI_RESET;
            String line = ANSI_PURPLE + "│" + ANSI_RESET;
            String bottomSeparator = ANSI_PURPLE + "└────────────────────────────────────────────────────────────────────────────────┘" + ANSI_RESET;
            
            logBuilder.append("\n").append(separator).append("\n");
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_PURPLE).append("📤 OUTGOING RESPONSE").append(ANSI_RESET).append(" [").append(requestId).append("]").append("\n");
            logBuilder.append(ANSI_PURPLE + "├────────────────────────────────────────────────────────────────────────────────┤" + ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URI:").append(ANSI_RESET).append("      ").append(request.getRequestURI()).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Status:").append(ANSI_RESET).append("   ").append(statusColor).append(status).append(ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Duration:").append(ANSI_RESET).append(" ").append(durationColor).append(duration).append(" ms").append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            log.info(logBuilder.toString());
        } catch (Exception e) {
            log.error("Error logging response details", e);
        }
    }
} 