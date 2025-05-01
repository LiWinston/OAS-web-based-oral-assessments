package org.swen90017.oas.utils;

import java.util.UUID;
import java.util.concurrent.Callable;

import org.slf4j.MDC;
import org.springframework.util.StringUtils;

import com.alibaba.ttl.TransmittableThreadLocal;

/**
 * Trace ID utility for distributed tracing
 * Uses TransmittableThreadLocal for automatic thread context propagation
 *
 * @author Yongchun Li
 */
public class TraceUtils {

    /**
     * Trace ID key in MDC
     */
    public static final String TRACE_ID = "traceId";
    
    /**
     * TransmittableThreadLocal for automatic thread context propagation
     */
    private static final TransmittableThreadLocal<String> TRACE_ID_TTL = new TransmittableThreadLocal<>();

    /**
     * Generate a new trace ID
     *
     * @return a unique trace ID
     */
    public static String generateTraceId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Set trace ID in both TTL and MDC context
     *
     * @param traceId trace ID to set
     */
    public static void setTraceId(String traceId) {
        if (StringUtils.hasText(traceId)) {
            // Set in TTL for automatic propagation to child threads
            TRACE_ID_TTL.set(traceId);
            // Also set in MDC for logging
            MDC.put(TRACE_ID, traceId);
        }
    }

    /**
     * Get current trace ID from TTL context
     *
     * @return current trace ID or null if not present
     */
    public static String getTraceId() {
        String traceId = TRACE_ID_TTL.get();
        // If TTL has a trace ID but MDC doesn't, sync it to MDC
        // This might happen when a thread created by TtlExecutors
        // accesses the trace ID for the first time
        if (StringUtils.hasText(traceId) && !StringUtils.hasText(MDC.get(TRACE_ID))) {
            MDC.put(TRACE_ID, traceId);
        }
        return traceId;
    }

    /**
     * Generate and set a new trace ID if none exists
     *
     * @return the current or newly generated trace ID
     */
    public static String getOrGenerateTraceId() {
        String traceId = getTraceId();
        if (!StringUtils.hasText(traceId)) {
            traceId = generateTraceId();
            setTraceId(traceId);
        }
        return traceId;
    }

    /**
     * Remove trace ID from both TTL and MDC context
     */
    public static void removeTraceId() {
        TRACE_ID_TTL.remove();
        MDC.remove(TRACE_ID);
    }

    /**
     * Clear all trace information
     */
    public static void clearTrace() {
        TRACE_ID_TTL.remove();
        MDC.clear();
    }
    
    /**
     * NOTE: With TTL, these wrapper methods are no longer necessary for most cases.
     * They are kept for backward compatibility and exceptional cases where the
     * thread pool is not wrapped with TtlExecutors.
     */
    
    /**
     * Wrap a runnable to preserve trace context in async threads
     * Only needed for thread pools not wrapped with TtlExecutors
     *
     * @param runnable The runnable to wrap
     * @return A runnable that preserves trace context
     */
    public static Runnable traceRunnable(Runnable runnable) {
        String traceId = getTraceId();
        return () -> {
            String oldTraceId = getTraceId();
            try {
                setTraceId(traceId);
                runnable.run();
            } finally {
                if (oldTraceId != null) {
                    setTraceId(oldTraceId);
                } else {
                    removeTraceId();
                }
            }
        };
    }
    
    /**
     * Wrap a callable to preserve trace context in async threads
     * Only needed for thread pools not wrapped with TtlExecutors
     *
     * @param <V> The callable return type
     * @param callable The callable to wrap
     * @return A callable that preserves trace context
     */
    public static <V> Callable<V> traceCallable(Callable<V> callable) {
        String traceId = getTraceId();
        return () -> {
            String oldTraceId = getTraceId();
            try {
                setTraceId(traceId);
                return callable.call();
            } finally {
                if (oldTraceId != null) {
                    setTraceId(oldTraceId);
                } else {
                    removeTraceId();
                }
            }
        };
    }
} 