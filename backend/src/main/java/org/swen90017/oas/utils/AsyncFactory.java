package org.swen90017.oas.utils;

import java.util.Date;
import java.util.TimerTask;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.swen90017.oas.entity.SysOperLog;
import org.swen90017.oas.service.ISysOperLogService;

/**
 * Async factory (used to produce tasks)
 */
public class AsyncFactory {
    private static final Logger log = LoggerFactory.getLogger(AsyncFactory.class);

    /**
     * Record operation log
     *
     * @param operLog Operation log info
     * @return Task
     */
    public static TimerTask recordOper(final SysOperLog operLog) {
        return new TimerTask() {
            @Override
            public void run() {
                try {
                    // Set operation time
                    operLog.setOperTime(new Date());
                    
                    // Get operation location based on IP
                    operLog.setOperLocation(AddressUtils.getRealAddressByIP(operLog.getOperIp()));
                    
                    // Insert to database
                    SpringUtils.getBean(ISysOperLogService.class).insertOperlog(operLog);
                    
                    log.info("Operation log saved successfully: {}", operLog.getTitle());
                } catch (Exception e) {
                    log.error("Failed to save operation log", e);
                }
            }
        };
    }
} 