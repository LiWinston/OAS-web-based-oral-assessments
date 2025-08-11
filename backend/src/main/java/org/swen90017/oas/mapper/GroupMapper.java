package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.SysGroup;
@Mapper
public interface GroupMapper extends BaseMapper<SysGroup> {
    @Select("SELECT * FROM sys_group WHERE canvas_group_id = #{canvasGroupId}")
    SysGroup selectByCanvasGroupId(@Param("canvasGroupId") String canvasGroupId);
}
