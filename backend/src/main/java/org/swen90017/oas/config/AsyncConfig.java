package org.swen90017.oas.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.alibaba.ttl.threadpool.TtlExecutors;

/**
 * Async configuration with TTL support for trace propagation
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Async task executor for @Async methods
     * Wrapped with TTL for automatic context propagation
     */
    @Bean("asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configure thread pool
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Async-");
        
        // Initialize the executor
        executor.initialize();
        
        // Wrap with TTL for automatic context propagation
        return TtlExecutors.getTtlExecutor(executor);
    }
} 