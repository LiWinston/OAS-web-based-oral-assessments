package org.swen90017.oas.service;

import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.swen90017.oas.utils.TraceUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Service to demonstrate different async operations
 */
@Service
public class AsyncDemoService {
    
    private static final Logger log = LoggerFactory.getLogger(AsyncDemoService.class);
    
    @Autowired
    @Qualifier("threadPoolTaskExecutor")
    private Executor executor;
    
    /**
     * Process data using ThreadPool executor (普通线程池提交/执行式异步)
     * 
     * @param data Input data
     * @return Result map
     */
    public Map<String, Object> processWithThreadPool(Map<String, Object> data) {
        log.info("Starting processWithThreadPool, traceId: {}", TraceUtils.getTraceId());
        
        // Submit a task to thread pool
        executor.execute(() -> {
            log.info("Inside thread pool task, traceId: {}", TraceUtils.getTraceId());
            
            try {
                // Simulate processing time
                Thread.sleep(500);
                log.info("Thread pool task completed, data: {}, traceId: {}", data, TraceUtils.getTraceId());
            } 
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Thread interrupted", e);
            }
        });
        
        Map<String, Object> result = new HashMap<>(data);
        result.put("processedBy", "ThreadPool");
        result.put("traceId", TraceUtils.getTraceId());
        
        return result;
    }
    
    /**
     * Process data using CompletableFuture (CompletableFuture异步)
     * 
     * @param data Input data
     * @return CompletableFuture with result
     */
    public CompletableFuture<Map<String, Object>> processWithCompletableFuture(Map<String, Object> data) {
        log.info("Starting processWithCompletableFuture, traceId: {}", TraceUtils.getTraceId());
        
        return CompletableFuture.supplyAsync(() -> {
            log.info("Inside CompletableFuture task, traceId: {}", TraceUtils.getTraceId());
            
            try {
                // Simulate processing time
                Thread.sleep(700);
                
                Map<String, Object> result = new HashMap<>(data);
                result.put("processedBy", "CompletableFuture");
                result.put("traceId", TraceUtils.getTraceId());
                
                log.info("CompletableFuture task completed, traceId: {}", TraceUtils.getTraceId());
                return result;
            } 
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Thread interrupted", e);
                throw new RuntimeException("Processing failed", e);
            }
        }, executor);
    }
    
    /**
     * Process data using @Async annotation
     * This implementation differs from CompletableFuture to demonstrate the distinct behavior
     * 
     * @param data Input data
     * @return CompletableFuture with result
     */
    @Async("asyncTaskExecutor")
    public CompletableFuture<Map<String, Object>> processWithAsyncAnnotation(Map<String, Object> data) {
        log.info("Inside @Async method, traceId: {}", TraceUtils.getTraceId());
        
        try {
            // Simulate processing time
            Thread.sleep(1000);
            
            // Add some additional processing specific to @Async implementation
            // More complex processing that differs from CompletableFuture implementation
            Map<String, Object> result = new HashMap<>(data);
            result.put("processedBy", "AsyncAnnotation");
            result.put("traceId", TraceUtils.getTraceId());
            
            // Add additional data only available in the @Async implementation
            result.put("asyncSpecific", true);
            result.put("asyncThreadName", Thread.currentThread().getName());
            result.put("asyncProcessingTime", 1000);
            
            // Simulate additional work
            if (data.containsKey("asyncParam")) {
                // Do some conditional processing specific to async
                result.put("asyncParamProcessed", "Processed: " + data.get("asyncParam"));
            }
            
            log.info("@Async method completed with extended processing, traceId: {}", TraceUtils.getTraceId());
            return CompletableFuture.completedFuture(result);
        } 
        catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Thread interrupted", e);
            throw new RuntimeException("Processing failed", e);
        }
    }
    
    /**
     * Process data using Reactor Flux/Mono (ReactorFlux)
     * 
     * @param data Input data
     * @return Mono with result
     */
    public Mono<Map<String, Object>> processWithReactor(Map<String, Object> data) {
        log.info("Starting processWithReactor, traceId: {}", TraceUtils.getTraceId());
        
        return Flux.range(1, 3)
            .subscribeOn(Schedulers.boundedElastic())
            .doOnNext(i -> {
                log.info("Reactor Flux step {}, traceId: {}", i, TraceUtils.getTraceId());
                try {
                    // Simulate processing time
                    TimeUnit.MILLISECONDS.sleep(300);
                } 
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            })
            .doOnComplete(() -> {
                log.info("Reactor Flux completed, traceId: {}", TraceUtils.getTraceId());
                
                // Simulate error in doOnComplete to test trace propagation
                if (data.containsKey("shouldError") && Boolean.TRUE.equals(data.get("shouldError"))) {
                    log.error("Simulated error in doOnComplete, traceId: {}", TraceUtils.getTraceId());
                    throw new RuntimeException("Simulated error in doOnComplete");
                }
            })
            .last()
            .map(i -> {
                Map<String, Object> result = new HashMap<>(data);
                result.put("processedBy", "ReactorFlux");
                result.put("traceId", TraceUtils.getTraceId());
                result.put("lastItem", i);
                
                log.info("Reactor map operation, traceId: {}", TraceUtils.getTraceId());
                return result;
            });
    }
} 