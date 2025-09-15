package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.SessionStudent;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SessionStudentMapper extends BaseMapper<SessionStudent> {

    /**
     * Find session booking by session ID and subject
     */
    SessionStudent selectBySessionAndSubject(@Param("sessionId") Long sessionId,
                                             @Param("type") String type,
                                             @Param("subjectId") Long subjectId);

    /**
     * Find all bookings for a session
     */
    List<SessionStudent> listBySession(@Param("sessionId") Long sessionId);

    /**
     * Find all bookings for a student/group
     */
    List<SessionStudent> listBySubject(@Param("type") String type,
                                       @Param("subjectId") Long subjectId);

    /**
     * Find bookings by session and type
     */
    List<SessionStudent> listBySessionAndType(@Param("sessionId") Long sessionId,
                                              @Param("type") String type);

    /**
     * Find bookings within time range
     */
    List<SessionStudent> listByTimeRange(@Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);

    /**
     * Check if session is booked by specific subject
     */
    boolean existsBySessionAndSubject(@Param("sessionId") Long sessionId,
                                      @Param("type") String type,
                                      @Param("subjectId") Long subjectId);

    /**
     * Count bookings for a session
     */
    int countBySession(@Param("sessionId") Long sessionId);
}
