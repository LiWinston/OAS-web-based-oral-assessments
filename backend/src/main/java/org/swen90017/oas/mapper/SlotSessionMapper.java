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
     * List all sessions by assignment (compatibility phase: joined via time_slots)
     */
    List<SlotSession> listSessionsByAssignment(@Param("assignmentId") Long assignmentId);
    
    /**
     * Count sessions under an assignment that are published to students but unstaffed (session-level publish validation)
     */
    int countUnstaffedPublishedSessions(@Param("assignmentId") Long assignmentId);

    /**
     * Query sessions under an assignment by date range (for calendar/student views)
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
     * Check if a student has already booked an assignment (including individual and group bookings)
     */
    boolean hasStudentBookedAssignment(@Param("studentId") Long studentId, @Param("assignmentId") Long assignmentId);
    
    /**
     * Check if a group has already booked an assignment
     */
    boolean hasGroupBookedAssignment(@Param("groupId") Long groupId, @Param("assignmentId") Long assignmentId);
    
    /**
     * Batch check a student's booking status across multiple assignments (including individual and group bookings)
     * Returns the set of assignment IDs the student has booked
     */
    List<Long> getStudentBookedAssignmentIds(@Param("studentId") Long studentId, @Param("assignmentIds") List<Long> assignmentIds);
}
