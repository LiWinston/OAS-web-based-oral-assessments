package org.swen90017.oas.config;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.reactivestreams.Publisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.swen90017.oas.utils.TraceUtils;

import reactor.core.publisher.Hooks;
import reactor.core.scheduler.Schedulers;

/**
 * Configuration for WebFlux with TTL support
 * Enables trace context propagation with Reactor operations
 */
@Configuration
public class WebFluxConfig {
    
    private static final Logger log = LoggerFactory.getLogger(WebFluxConfig.class);
    private static final String HOOK_KEY = ReactorContextHook.HOOK_KEY;
    
    // Create singleton ReactorContextHook to avoid repeated instantiation
    private final ReactorContextHook reactorContextHook = new ReactorContextHook();
    
    /**
     * Configure Reactor to use TTL for context propagation
     */
    @PostConstruct
    public void init() {
        log.info("Configuring Reactor with TTL context propagation support");
        
        // Decorate Reactor Schedulers to support TTL context propagation
        Schedulers.onScheduleHook(HOOK_KEY, runnable -> {
            String traceId = TraceUtils.getTraceId();
            return () -> {
                String oldTraceId = TraceUtils.getTraceId();
                try {
                    // Restore the calling thread's traceId
                    if (traceId != null) {
                        TraceUtils.setTraceId(traceId);
                    }
                    // Execute the original task
                    runnable.run();
                } finally {
                    // Restore the original traceId (if any)
                    if (oldTraceId != null) {
                        TraceUtils.setTraceId(oldTraceId);
                    } else {
                        TraceUtils.removeTraceId();
                    }
                }
            };
        });
        
        // Use ReactorContextHook to enhance all Reactor operators - using singleton to avoid repeated creation
        Hooks.onEachOperator(HOOK_KEY, (Publisher<Object> p) -> {
            return (Publisher<Object>) reactorContextHook.apply(p);
        });
    }
    
    /**
     * Clean up Reactor hooks on shutdown
     */
    @PreDestroy
    public void cleanup() {
        log.info("Cleaning up Reactor TTL hooks");
        Schedulers.resetOnScheduleHook(HOOK_KEY);
        Hooks.resetOnEachOperator(HOOK_KEY);
    }
} 