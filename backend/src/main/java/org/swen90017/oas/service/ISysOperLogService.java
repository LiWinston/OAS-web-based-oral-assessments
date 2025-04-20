package org.swen90017.oas.service;

import java.util.List;

import org.swen90017.oas.entity.SysOperLog;

/**
 * Operation log service interface
 */
public interface ISysOperLogService {
    /**
     * Insert operation log
     * 
     * @param operLog Operation log object
     */
    void insertOperlog(SysOperLog operLog);

    /**
     * Query the operation log list
     * 
     * @param operLog Operation log object
     * @return Operation log collection
     */
    List<SysOperLog> selectOperLogList(SysOperLog operLog);

    /**
     * Delete operation logs by IDs
     * 
     * @param operIds Log IDs
     * @return Result
     */
    int deleteOperLogByIds(Long[] operIds);

    /**
     * Delete operation logs
     * 
     * @param operIds Log IDs
     * @return Result
     */
    int deleteOperLogById(Long operIds);

    /**
     * Clear operation logs
     */
    void cleanOperLog();
} 