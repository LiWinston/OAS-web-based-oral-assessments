package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.AssignmentSessionConfig;
@Mapper
public interface AssignmentSessionConfigMapper extends BaseMapper<AssignmentSessionConfig> {
    int upsert(@Param("c") AssignmentSessionConfig cfg);

}
