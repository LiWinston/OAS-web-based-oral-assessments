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
     * @param request HTTP request
     * @return Trace ID
     */
    private String getOrGenerateTraceId(HttpServletRequest request) {
        // Try to get trace ID from request header
        String traceId = request.getHeader(TRACE_ID_HEADER);
        
        // If not found, generate a new one
        if (!StringUtils.hasText(traceId)) {
            traceId = TraceUtils.generateTraceId();
        }
        
        return traceId;
    }
} 