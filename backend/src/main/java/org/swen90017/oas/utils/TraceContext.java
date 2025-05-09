package org.swen90017.oas.utils;

import com.alibaba.ttl.TransmittableThreadLocal;

/**
 * Trace context for storing additional tracing information
 * Uses TransmittableThreadLocal for automatic thread context propagation
 *
 * @author Yongchun Li
 */
public final class TraceContext {
    
    /**
     * Thread local storage for trace information, using TTL for auto-propagation
     */
    private static final TransmittableThreadLocal<TraceContext> CONTEXT = new TransmittableThreadLocal<>();
    
    /**
     * The trace ID for this context
     */
    private String traceId;
    
    /**
     * Request start time
     */
    private long startTime;
    
    /**
     * Private constructor to enforce usage via static methods
     */
    private TraceContext() {
        this.startTime = System.currentTimeMillis();
    }
    
    /**
     * Get current trace context, creating one if none exists
     *
     * @return Current trace context
     */
    public static TraceContext current() {
        TraceContext context = CONTEXT.get();
        if (context == null) {
            context = new TraceContext();
            CONTEXT.set(context);
        }
        return context;
    }
    
    /**
     * Initialize context with trace ID
     *
     * @param traceId Trace ID to use
     */
    public static void init(String traceId) {
        TraceContext context = new TraceContext();
        context.setTraceId(traceId);
        CONTEXT.set(context);
    }
    
    /**
     * Clear the trace context
     */
    public static void clear() {
        CONTEXT.remove();
    }
    
    /**
     * Get trace ID
     *
     * @return Current trace ID
     */
    public String getTraceId() {
        return traceId;
    }
    
    /**
     * Set trace ID
     *
     * @param traceId Trace ID to set
     */
    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }
    
    /**
     * Get request start time
     *
     * @return Request start time in milliseconds
     */
    public long getStartTime() {
        return startTime;
    }
    
    /**
     * Calculate duration since context creation
     *
     * @return Duration in milliseconds
     */
    public long getDuration() {
        return System.currentTimeMillis() - startTime;
    }
} 