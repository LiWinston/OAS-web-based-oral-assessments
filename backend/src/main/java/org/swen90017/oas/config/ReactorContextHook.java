package org.swen90017.oas.config;

import java.util.function.Function;
import org.reactivestreams.Publisher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.swen90017.oas.utils.TraceUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Signal;

/**
 * Reactor Context Hook for TTL propagation in Reactor operators
 * Enhanced Reactor context propagation to ensure traceId is maintained in all operators
 */
public class ReactorContextHook implements Function<Publisher<?>, Publisher<?>> {

    private static final Logger log = LoggerFactory.getLogger(ReactorContextHook.class);

    /**
     * Hook name
     */
    public static final String HOOK_KEY = "TTL_CONTEXT_HOOK";
    
    /**
     * ThreadLocal variable to prevent recursive calls
     */
    private static final ThreadLocal<Boolean> HOOK_EXECUTING = new ThreadLocal<>();

    /**
     * Decorates Reactor operators
     * 
     * @param source Original Publisher
     * @return Enhanced Publisher
     */
    @Override
    @SuppressWarnings({ "unchecked", "rawtypes" })
    public Publisher<?> apply(Publisher<?> source) {
        // Prevent recursive calls that would cause stack overflow
        if (Boolean.TRUE.equals(HOOK_EXECUTING.get())) {
            return source;
        }
        
        try {
            HOOK_EXECUTING.set(Boolean.TRUE);
            
            String traceId = TraceUtils.getTraceId();
            
            // If no traceId exists, return the original Publisher
            if (traceId == null) {
                return source;
            }
            
            if (log.isTraceEnabled()) {
                log.trace("Applying traceId to Reactor stream: {}", traceId);
            }
            
            final String capturedTraceId = traceId;
            
            // Handle different Publisher types
            if (source instanceof Mono) {
                return ((Mono) source)
                    .doOnEach(signal -> applyTraceId(capturedTraceId))
                    .doFinally(signalType -> cleanupTraceId());
            } else if (source instanceof Flux) {
                return ((Flux) source)
                    .doOnEach(signal -> applyTraceId(capturedTraceId))
                    .doFinally(signalType -> cleanupTraceId());
            }
            
            // For other Publisher types, return the original instance
            return source;
        } finally {
            HOOK_EXECUTING.remove();
        }
    }
    
    /**
     * Apply the specified traceId to current thread
     */
    private void applyTraceId(String traceId) {
        try {
            if (traceId != null) {
                TraceUtils.setTraceId(traceId);
            }
        } catch (Exception e) {
            log.error("Failed to apply traceId: {}", traceId, e);
        }
    }
    
    /**
     * Clean up the traceId from current thread
     */
    private void cleanupTraceId() {
        try {
            TraceUtils.removeTraceId();
        } catch (Exception e) {
            log.error("Failed to cleanup traceId", e);
        }
    }
} 