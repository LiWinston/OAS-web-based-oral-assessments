package org.swen90017.oas.service.impl;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.swen90017.oas.entity.SysOperLog;
import org.swen90017.oas.mapper.SysOperLogMapper;
import org.swen90017.oas.service.ISysOperLogService;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

/**
 * Operation log service implementation
 */
@Service
public class SysOperLogServiceImpl implements ISysOperLogService {
    @Autowired
    private SysOperLogMapper operLogMapper;

    /**
     * Insert operation log
     * 
     * @param operLog Operation log object
     */
    @Override
    public void insertOperlog(SysOperLog operLog) {
        operLogMapper.insert(operLog);
    }

    /**
     * Query operation log list
     * 
     * @param operLog Operation log object
     * @return Operation log collection
     */
    @Override
    public List<SysOperLog> selectOperLogList(SysOperLog operLog) {
        QueryWrapper<SysOperLog> queryWrapper = new QueryWrapper<>();
        
        // Add query conditions based on provided parameters
        if (operLog != null) {
            if (operLog.getTitle() != null && !operLog.getTitle().isEmpty()) {
                queryWrapper.like("title", operLog.getTitle());
            }
            
            if (operLog.getBusinessType() != null) {
                queryWrapper.eq("business_type", operLog.getBusinessType());
            }
            
            if (operLog.getStatus() != null) {
                queryWrapper.eq("status", operLog.getStatus());
            }
            
            if (operLog.getOperName() != null && !operLog.getOperName().isEmpty()) {
                queryWrapper.like("oper_name", operLog.getOperName());
            }
        }
        
        // Sort by operation time in descending order
        queryWrapper.orderByDesc("oper_time");
        
        return operLogMapper.selectList(queryWrapper);
    }

    /**
     * Delete operation logs by IDs
     * 
     * @param operIds Log IDs
     * @return Result
     */
    @Override
    public int deleteOperLogByIds(Long[] operIds) {
        return operLogMapper.deleteBatchIds(Arrays.asList(operIds));
    }

    /**
     * Delete operation log
     * 
     * @param operId Log ID
     * @return Result
     */
    @Override
    public int deleteOperLogById(Long operId) {
        return operLogMapper.deleteById(operId);
    }

    /**
     * Clean operation logs
     */
    @Override
    @Transactional
    public void cleanOperLog() {
        operLogMapper.delete(new QueryWrapper<>());
    }
} 