package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.SessionExaminer;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SessionExaminerMapper extends BaseMapper<SessionExaminer> {
    int batchInsert(@Param("list") List<SessionExaminer> list);
    List<Long> listExaminerIdsBySession(@Param("sessionId") Long sessionId);
    int deleteOne(@Param("sessionId") Long sessionId, @Param("examinerId") Long examinerId);
    List<Long> findConflictedSessionsForExaminer(@Param("examinerId") Long examinerId,
                                                 @Param("startAt") LocalDateTime startAt,
                                                 @Param("endAt") LocalDateTime endAt);
}


