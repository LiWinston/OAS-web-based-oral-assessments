package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.swen90017.oas.entity.Assignment;

/**
 * Assignment Mapper
 * Handles database operations for Assignment entity
 */
@Mapper
public interface AssignmentMapper extends BaseMapper<Assignment> {
}
