package org.swen90017.oas.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.enums.OperatorType;
import org.swen90017.oas.service.AsyncDemoService;
import org.swen90017.oas.utils.IpUtils;
import org.swen90017.oas.utils.TraceUtils;

import reactor.core.publisher.Mono;

/**
 * Tracing Demo Controller - Tests various async operations with trace ID propagation
 */
@RestController
@RequestMapping("/api/tracing")
public class TracingDemoController {
    
    private static final Logger log = LoggerFactory.getLogger(TracingDemoController.class);
    
    @Autowired
    private AsyncDemoService asyncDemoService;
    
    /**
     * Test thread pool execution
     * 
     * @param data Optional request data
     * @return Response with current trace ID
     */
    @PostMapping("/thread-pool")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public Map<String, Object> testThreadPool(@RequestBody(required = false) Map<String, Object> data) {
        log.info("testThreadPool called, traceId: {}", TraceUtils.getTraceId());
        
        if (data == null) {
            data = new HashMap<>();
        }
        data.put("timestamp", System.currentTimeMillis());
        data.put("clientIp", IpUtils.getIpAddr());
        
        Map<String, Object> result = asyncDemoService.processWithThreadPool(data);
        result.put("controllerTraceId", TraceUtils.getTraceId());
        
        return result;
    }
    
    /**
     * Test CompletableFuture execution
     * 
     * @param data Optional request data
     * @return CompletableFuture result with trace ID info
     */
    @PostMapping("/completable-future")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public CompletableFuture<Map<String, Object>> testCompletableFuture(@RequestBody(required = false) Map<String, Object> data) {
        log.info("testCompletableFuture called, traceId: {}", TraceUtils.getTraceId());
        
        if (data == null) {
            data = new HashMap<>();
        }
        data.put("timestamp", System.currentTimeMillis());
        data.put("clientIp", IpUtils.getIpAddr());
        
        String controllerTraceId = TraceUtils.getTraceId();
        
        return asyncDemoService.processWithCompletableFuture(data)
                .thenApply(result -> {
                    log.info("CompletableFuture completed in controller, traceId: {}", TraceUtils.getTraceId());
                    result.put("controllerTraceId", controllerTraceId);
                    result.put("thenApplyTraceId", TraceUtils.getTraceId());
                    return result;
                });
    }
    
    /**
     * Test @Async annotation
     * 
     * @param data Optional request data
     * @param asyncParam Special parameter for @Async testing
     * @return CompletableFuture result with trace ID info
     */
    @PostMapping("/async-annotation")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public CompletableFuture<Map<String, Object>> testAsyncAnnotation(
            @RequestBody(required = false) Map<String, Object> data,
            @RequestParam(required = false, defaultValue = "defaultAsyncValue") String asyncParam) {
        log.info("testAsyncAnnotation called, traceId: {}, asyncParam: {}", TraceUtils.getTraceId(), asyncParam);
        
        if (data == null) {
            data = new HashMap<>();
        }
        data.put("timestamp", System.currentTimeMillis());
        data.put("clientIp", IpUtils.getIpAddr());
        data.put("asyncParam", asyncParam);
        
        String controllerTraceId = TraceUtils.getTraceId();
        
        return asyncDemoService.processWithAsyncAnnotation(data)
                .thenApply(result -> {
                    log.info("@Async completed in controller, traceId: {}", TraceUtils.getTraceId());
                    result.put("controllerTraceId", controllerTraceId);
                    result.put("thenApplyTraceId", TraceUtils.getTraceId());
                    return result;
                });
    }
    
    /**
     * Test Reactor Flux/Mono execution
     * 
     * @param shouldError Whether to simulate error in doOnComplete
     * @return Mono result with trace ID info
     */
    @PostMapping("/reactor")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public Mono<Map<String, Object>> testReactor(
            @RequestParam(required = false, defaultValue = "false") boolean shouldError,
            @RequestBody(required = false) Map<String, Object> data) {
        log.info("testReactor called, traceId: {}, shouldError: {}", TraceUtils.getTraceId(), shouldError);
        
        if (data == null) {
            data = new HashMap<>();
        }
        data.put("timestamp", System.currentTimeMillis());
        data.put("clientIp", IpUtils.getIpAddr());
        data.put("shouldError", shouldError);
        
        String controllerTraceId = TraceUtils.getTraceId();
        
        return asyncDemoService.processWithReactor(data)
                .doOnSuccess(result -> {
                    log.info("Reactor completed successfully in controller, traceId: {}", TraceUtils.getTraceId());
                    result.put("controllerTraceId", controllerTraceId);
                })
                .doOnError(error -> {
                    log.error("Reactor error in controller, traceId: {}: {}", TraceUtils.getTraceId(), error.getMessage());
                });
    }
    
    /**
     * Simple endpoint with synchronous execution
     */
    @GetMapping("/sync")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public Map<String, Object> testSync() {
        log.info("testSync called, traceId: {}", TraceUtils.getTraceId());
        
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Synchronous execution");
        result.put("timestamp", System.currentTimeMillis());
        result.put("traceId", TraceUtils.getTraceId());
        
        return result;
    }
    
    /**
     * Combined test - triggers all types of async operations
     * Useful for testing multiple async operations with the same trace ID
     */
    @GetMapping("/test-all")
    @Log(module = "Tracing Module", businessType = BusinessType.OTHER, operatorType = OperatorType.OTHER)
    public Map<String, Object> testAll() {
        log.info("testAll called, traceId: {}", TraceUtils.getTraceId());
        
        Map<String, Object> data = new HashMap<>();
        data.put("timestamp", System.currentTimeMillis());
        data.put("test", "Combined test");
        data.put("asyncParam", "combined-test-param");
        
        // Run thread pool test
        Map<String, Object> threadPoolResult = asyncDemoService.processWithThreadPool(data);
        
        // Trigger other async operations but don't wait for them
        asyncDemoService.processWithCompletableFuture(data);
        asyncDemoService.processWithAsyncAnnotation(data);
        asyncDemoService.processWithReactor(data).subscribe(
            result -> log.info("Reactor result in combined test: {}", result),
            error -> log.error("Reactor error in combined test: {}", error.getMessage())
        );
        
        // Build the result
        Map<String, Object> result = new HashMap<>();
        result.put("message", "All async tests triggered");
        result.put("controllerTraceId", TraceUtils.getTraceId());
        result.put("threadPoolResult", threadPoolResult);
        
        return result;
    }
} 