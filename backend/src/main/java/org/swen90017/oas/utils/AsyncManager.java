package org.swen90017.oas.utils;

import java.util.TimerTask;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Async task manager
 */
public class AsyncManager {
    /**
     * Operation delay 10 milliseconds
     */
    private final int OPERATE_DELAY_TIME = 10;

    /**
     * Async operation task scheduling thread pool
     */
    private ScheduledExecutorService executor;
    
    /**
     * Singleton pattern
     */
    private AsyncManager() {
        this.executor = SpringUtils.getBean("scheduledExecutorService");
    }

    private static AsyncManager me = new AsyncManager();

    public static AsyncManager me() {
        return me;
    }

    /**
     * Execute task
     * 
     * @param task Task
     */
    public void execute(TimerTask task) {
        executor.schedule(task, OPERATE_DELAY_TIME, TimeUnit.MILLISECONDS);
    }

    /**
     * Stop task thread pool
     */
    public void shutdown() {
        if (executor != null && !executor.isShutdown()) {
            executor.shutdown();
        }
    }
} 