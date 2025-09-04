package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.swen90017.oas.entity.TimeSlot;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Mapper
public interface TimeSlotMapper extends BaseMapper<TimeSlot> {

    int countVenueOverlap(@Param("assignmentId") Long assignmentId,
                          @Param("venueId") Long venueId,
                          @Param("startAt") LocalDateTime startAt,
                          @Param("endAt") LocalDateTime endAt,
                          @Param("excludeSlotId") Long excludeSlotId);
    List<TimeSlot> selectByFilters(@Param("assignmentId") Long assignmentId,
                                   @Param("status") String status,
                                   @Param("startAt") LocalDateTime startAt,
                                   @Param("endAt") LocalDateTime endAt);

    int updateCountersAndStatus(@Param("slotId") Long slotId,
                                @Param("currentExaminers") int currentExaminers,
                                @Param("bookedSessions") int bookedSessions);

    int sumAssignedSessionsForExaminer(@Param("assignmentId") Long assignmentId,
                                       @Param("examinerId") Long examinerId);

    @Select("SELECT * FROM time_slots WHERE assignment_id = #{assignmentId} ORDER BY start_at ASC")
    List<TimeSlot> listByAssignment(@Param("assignmentId") Long assignmentId);

    List<TimeSlot> selectByMonth(@Param("assignmentId") Long assignmentId,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate);
}
