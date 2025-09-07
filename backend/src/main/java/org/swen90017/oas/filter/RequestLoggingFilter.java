package org.swen90017.oas.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.ServletUtils;
import org.swen90017.oas.utils.TraceContext;
import org.swen90017.oas.utils.TraceUtils;

import com.alibaba.fastjson2.JSON;

/**
 * Global request logging filter
 * Works with TracingFilter to provide request/response logging with trace IDs
 *
 * @author Yongchun Li
 */
@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    
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
        
        // Get trace ID (already set by TracingFilter thanks to TTL)
        String traceId = TraceUtils.getTraceId();
        
        // Wrap response to cache content for reading
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        
        try {
            // Record request log
            logRequestDetails(request, traceId);
            
            // Continue processing the request
            filterChain.doFilter(request, responseWrapper);
        } finally {
            // Get duration from TraceContext (automatically propagated by TTL)
            long duration = TraceContext.current().getDuration();
            
            // Record response log with enhanced business error detection
            logResponseDetailsEnhanced(request, responseWrapper, duration, traceId);
            
            // Copy the cached content to the original response
            responseWrapper.copyBodyToResponse();
        }
    }
    
    /**
     * Record request details
     *
     * @param request   Request
     * @param traceId   Trace ID
     */
    private void logRequestDetails(HttpServletRequest request, String traceId) {
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
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_BLUE).append("🔔 INCOMING REQUEST").append(ANSI_RESET).append(" [").append(traceId).append("]").append("\n");
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
     * Record response details with enhanced business error detection
     *
     * @param request           Request
     * @param responseWrapper   Response wrapper
     * @param duration          Processing time
     * @param traceId           Trace ID
     */
    private void logResponseDetailsEnhanced(HttpServletRequest request, ContentCachingResponseWrapper responseWrapper, long duration, String traceId) {
        try {
            int httpStatus = responseWrapper.getStatus();
            boolean isBusinessError = false;
            String errorCode = null;
            String errorMessage = null;
            
            // Try to parse response body to detect business errors
            byte[] responseBody = responseWrapper.getContentAsByteArray();
            if (responseBody.length > 0) {
                try {
                    String responseBodyStr = new String(responseBody, responseWrapper.getCharacterEncoding());
                    // Try to parse as Result object
                    Result<?> result = JSON.parseObject(responseBodyStr, Result.class);
                    if (result != null && !result.isSuccess()) {
                        isBusinessError = true;
                        errorCode = result.getCode();
                        if (result.getData() instanceof String) {
                            errorMessage = (String) result.getData();
                        }
                    }
                } catch (Exception e) {
                    // If parsing fails, just use HTTP status
                }
            }
            
            // Determine status color and icon
            String statusColor;
            String statusIcon;
            String statusText;
            
            if (isBusinessError) {
                statusColor = ANSI_RED;
                statusIcon = "❌";
                statusText = "BUSINESS_ERROR";
            } else if (httpStatus >= 400 && httpStatus < 500) {
                statusColor = ANSI_YELLOW;
                statusIcon = "⚠️";
                statusText = String.valueOf(httpStatus);
            } else if (httpStatus >= 500) {
                statusColor = ANSI_RED;
                statusIcon = "❌";
                statusText = String.valueOf(httpStatus);
            } else {
                statusColor = ANSI_GREEN;
                statusIcon = "✅";
                statusText = String.valueOf(httpStatus);
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
            String separator = statusColor + "┌────────────────────────────────────────────────────────────────────────────────┐" + ANSI_RESET;
            String line = statusColor + "│" + ANSI_RESET;
            String bottomSeparator = statusColor + "└────────────────────────────────────────────────────────────────────────────────┘" + ANSI_RESET;
            
            logBuilder.append("\n").append(separator).append("\n");
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(statusColor).append(statusIcon).append(" OUTGOING RESPONSE").append(ANSI_RESET).append(" [").append(traceId).append("]").append("\n");
            logBuilder.append(statusColor + "├────────────────────────────────────────────────────────────────────────────────┤" + ANSI_RESET).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("URI:").append(ANSI_RESET).append("      ").append(request.getRequestURI()).append("\n");
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Status:").append(ANSI_RESET).append("   ").append(statusColor).append(statusText).append(ANSI_RESET);
            
            // Add business error details if present
            if (isBusinessError) {
                if (errorCode != null) {
                    logBuilder.append(" [").append(errorCode).append("]");
                }
                logBuilder.append("\n");
                if (errorMessage != null) {
                    logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Error:").append(ANSI_RESET).append("    ").append(ANSI_RED).append(errorMessage).append(ANSI_RESET).append("\n");
                }
            } else {
                logBuilder.append("\n");
            }
            
            logBuilder.append(line).append(" 🔹 ").append(ANSI_BOLD).append("Duration:").append(ANSI_RESET).append(" ").append(durationColor).append(duration).append(" ms").append(ANSI_RESET).append("\n");
            logBuilder.append(bottomSeparator);
            
            if (isBusinessError) {
                log.error(logBuilder.toString());
            } else {
                log.info(logBuilder.toString());
            }
        } catch (Exception e) {
            log.error("Error logging response details", e);
        }
    }

    /**
     * Record response details (original method for reference)
     *
     * @param request   Request
     * @param response  Response
     * @param duration  Processing time
     * @param traceId   Trace ID
     */
    private void logResponseDetails(HttpServletRequest request, HttpServletResponse response, long duration, String traceId) {
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
            logBuilder.append(line).append(" ").append(ANSI_BOLD).append(ANSI_PURPLE).append("📤 OUTGOING RESPONSE").append(ANSI_RESET).append(" [").append(traceId).append("]").append("\n");
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