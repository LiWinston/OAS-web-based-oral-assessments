package org.swen90017.oas.config;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.beans.factory.annotation.Value;
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

    // Thread pool configuration from application.yml
    @Value("${spring.thread-pool.async.core-pool-size:5}")
    private int corePoolSize;

    @Value("${spring.thread-pool.async.max-pool-size:10}")
    private int maxPoolSize;

    @Value("${spring.thread-pool.async.queue-capacity:100}")
    private int queueCapacity;

    @Value("${spring.thread-pool.async.keep-alive-seconds:60}")
    private int keepAliveSeconds;

    @Value("${spring.thread-pool.async.thread-name-prefix:Async-}")
    private String threadNamePrefix;

    /**
     * Async task executor for @Async methods
     * Wrapped with TTL for automatic context propagation
     */
    @Bean("asyncTaskExecutor")
    public Executor asyncTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configure thread pool with values from application.yml
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(keepAliveSeconds);
        executor.setThreadNamePrefix(threadNamePrefix);
        
        // Set rejection policy
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // Initialize the executor
        executor.initialize();
        
        // Wrap with TTL for automatic context propagation
        return TtlExecutors.getTtlExecutor(executor);
    }
} 