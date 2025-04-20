package org.swen90017.oas.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.swen90017.oas.entity.SysOperLog;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
 * Operation log mapper
 */
@Mapper
public interface SysOperLogMapper extends BaseMapper<SysOperLog> {
} 