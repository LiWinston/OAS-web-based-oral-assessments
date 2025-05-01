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
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.swen90017.oas.utils.TraceContext;
import org.swen90017.oas.utils.TraceUtils;

/**
 * Tracing filter for distributed tracing
 * This filter runs before all other filters to ensure trace ID is available
 * Uses TransmittableThreadLocal (TTL) for automatic propagation to child threads
 *
 * @author Yongchun Li
 */
@Component
@Order(0) // Ensure this runs before RequestLoggingFilter (which has Order(1))
public class TracingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(TracingFilter.class);
    
    /**
     * Trace ID header name
     */
    private static final String TRACE_ID_HEADER = "X-Trace-ID";
    
    /**
     * Maximum trace ID length to prevent abuse
     */
    private static final int MAX_TRACE_ID_LENGTH = 64;
    
    /**
     * Valid trace ID pattern (alphanumeric and hyphens)
     */
    private static final String TRACE_ID_PATTERN = "^[a-zA-Z0-9-]+$";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // Get trace ID from request header or generate a new one
            String traceId = getOrGenerateTraceId(request);
            
            // Set trace ID in TTL and MDC for logging
            TraceUtils.setTraceId(traceId);
            
            // Initialize trace context with TTL support
            TraceContext.init(traceId);
            
            // Add trace ID to response header
            response.setHeader(TRACE_ID_HEADER, traceId);
            
            if (log.isDebugEnabled()) {
                log.debug("Set trace ID [{}] for request [{}]", traceId, request.getRequestURI());
            }
            
            // Continue processing the request
            filterChain.doFilter(request, response);
        } finally {
            // Clear trace context and MDC
            TraceContext.clear();
            TraceUtils.removeTraceId();
        }
    }
    
    /**
     * Get trace ID from request header or generate a new one
     * 
     * NOTE: This method accepts client-provided trace IDs for distributed tracing across services.
     * This is useful in microservice architectures where a request travels through multiple services
     * and we want to maintain the same trace ID throughout the entire request chain.
     *
     * @param request HTTP request
     * @return Trace ID - from request header (if valid) or newly generated
     */
    private String getOrGenerateTraceId(HttpServletRequest request) {
        // Try to get trace ID from request header
        String traceId = request.getHeader(TRACE_ID_HEADER);
        
        // Validate client-provided trace ID
        if (StringUtils.hasText(traceId)) {
            // Check if trace ID meets requirements
            if (isValidTraceId(traceId)) {
                if (log.isDebugEnabled()) {
                    log.debug("Using client-provided trace ID: {}", traceId);
                }
                return traceId;
            } else {
                log.warn("Rejecting invalid client-provided trace ID: {}", traceId);
                // Fall through to generate a new one
            }
        }
        
        // Generate a new trace ID if not provided or invalid
        return TraceUtils.generateTraceId();
    }
    
    /**
     * Validate a trace ID
     * 
     * @param traceId Trace ID to validate
     * @return true if valid, false otherwise
     */
    private boolean isValidTraceId(String traceId) {
        return traceId != null && 
               traceId.length() <= MAX_TRACE_ID_LENGTH && 
               traceId.matches(TRACE_ID_PATTERN);
    }
} 