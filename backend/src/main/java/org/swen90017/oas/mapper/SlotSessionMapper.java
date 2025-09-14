package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.SlotSession;

import java.util.List;
@Mapper
public interface SlotSessionMapper extends BaseMapper<SlotSession> {
    int batchInsert(@Param("list") List<SlotSession> list);
    List<SlotSession> findBySlotId(@Param("slotId") Long slotId);
    int deleteBySlotId(@Param("slotId") Long slotId);
    List<SlotSession> findOutOfRangeBySlot(
            @Param("slotId") Long slotId,
            @Param("startAt") java.time.LocalDateTime startAt,
            @Param("endAt") java.time.LocalDateTime endAt);
    int deleteOutOfRangeBySlot(
            @Param("slotId") Long slotId,
            @Param("startAt") java.time.LocalDateTime startAt,
            @Param("endAt") java.time.LocalDateTime endAt);
    int book(@Param("sessionId") Long sessionId,
             @Param("bookedSubjectId") Long bookedSubjectId,
             @Param("bookedSubjectType") String bookedSubjectType);

    int unbook(@Param("sessionId") Long sessionId);

    int countBookedBySlot(@Param("slotId") Long slotId);
    
    List<SlotSession> findAvailableSessionsByAssignment(@Param("assignmentId") Long assignmentId);
    
    /**
     * 按 assignment 列出所有 sessions（兼容阶段：通过 time_slots 关联）
     */
    List<SlotSession> listSessionsByAssignment(@Param("assignmentId") Long assignmentId);
    
    /**
     * 统计某作业下标记对学生发布但未配员的会话数（会话级发布校验）
     */
    int countUnstaffedPublishedSessions(@Param("assignmentId") Long assignmentId);

    /**
     * 按日期范围查询 assignment 下 sessions（用于日历/学生视图）
     */
    List<SlotSession> listSessionsByAssignmentAndRange(@Param("assignmentId") Long assignmentId,
                                                       @Param("startAt") java.time.LocalDateTime startAt,
                                                       @Param("endAt") java.time.LocalDateTime endAt);

    int countVenueOverlap(@Param("assignmentId") Long assignmentId,
                          @Param("venueId") Long venueId,
                          @Param("date") java.time.LocalDateTime date,
                          @Param("startAt") java.time.LocalDateTime startAt,
                          @Param("endAt") java.time.LocalDateTime endAt,
                          @Param("excludeSessionId") Long excludeSessionId);

    int incrementBookedIfAvailable(@Param("sessionId") Long sessionId);
    int decrementBookedIfExists(@Param("sessionId") Long sessionId);
    
    List<SlotSession> findActiveBookingsByStudent(@Param("studentId") Long studentId, @Param("assignmentId") Long assignmentId);
    
    /**
     * 检查学生是否已经为某个assignment预定过（包括个人预定和组预定）
     */
    boolean hasStudentBookedAssignment(@Param("studentId") Long studentId, @Param("assignmentId") Long assignmentId);
    
    /**
     * 检查组是否已经为某个assignment预定过
     */
    boolean hasGroupBookedAssignment(@Param("groupId") Long groupId, @Param("assignmentId") Long assignmentId);
    
    /**
     * 批量检查学生对多个assignment的预定状态（包括个人预定和组预定）
     * 返回该学生已预定的assignment ID集合
     */
    List<Long> getStudentBookedAssignmentIds(@Param("studentId") Long studentId, @Param("assignmentIds") List<Long> assignmentIds);
}
