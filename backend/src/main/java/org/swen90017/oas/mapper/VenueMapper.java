package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.Venue;

import java.util.List;

@Mapper
public interface VenueMapper extends BaseMapper<Venue> {
    int upsertBatch(@Param("list") List<Venue> list);

    List<Venue> listByAssignmentId(@Param("assignmentId") Long assignmentId);
}