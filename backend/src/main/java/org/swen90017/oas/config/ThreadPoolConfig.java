package org.swen90017.oas.config;

import java.util.concurrent.Executor;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.alibaba.ttl.threadpool.TtlExecutors;

/**
 * Thread pool configuration with TransmittableThreadLocal (TTL) support
 */
@Configuration
public class ThreadPoolConfig {
    // Core thread pool size
    @Value("${spring.thread-pool.default.core-pool-size:10}")
    private int corePoolSize;

    // Maximum thread pool size
    @Value("${spring.thread-pool.default.max-pool-size:50}")
    private int maxPoolSize;

    // Queue size
    @Value("${spring.thread-pool.default.queue-capacity:200}")
    private int queueCapacity;

    // Idle thread alive time
    @Value("${spring.thread-pool.default.keep-alive-seconds:300}")
    private int keepAliveSeconds;

    @Bean(name = "threadPoolTaskExecutor")
    public Executor threadPoolTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setKeepAliveSeconds(keepAliveSeconds);
        // Rejection policy: Caller runs the task in the caller's thread
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // Initialize the executor
        executor.initialize();
        
        // Wrap with TTL for automatic context propagation
        return TtlExecutors.getTtlExecutor(executor);
    }

    /**
     * Scheduled thread pool for executing timed tasks, wrapped with TTL
     */
    @Bean(name = "scheduledExecutorService")
    protected ScheduledExecutorService scheduledExecutorService() {
        ScheduledThreadPoolExecutor executor = new ScheduledThreadPoolExecutor(corePoolSize);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // Wrap with TTL for automatic context propagation
        return TtlExecutors.getTtlScheduledExecutorService(executor);
    }
} 