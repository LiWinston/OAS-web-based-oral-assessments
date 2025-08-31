package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.TimeSlot;
import org.swen90017.oas.entity.TimeSlotExaminer;

import java.util.List;

@Mapper
public interface TimeSlotExaminersMapper extends BaseMapper<TimeSlotExaminer> {
    int deleteOne(@Param("slotId") Long slotId, @Param("examinerId") Long examinerId);
    List<Long> listExaminerIdsBySlot(@Param("slotId") Long slotId);

    List<Long> findConflictedSlotsForExaminer(@Param("examinerId") Long examinerId,
                                              @Param("startAt") java.time.LocalDateTime startAt,
                                              @Param("endAt") java.time.LocalDateTime endAt);

    /**
     * List slots assigned to an examiner, optionally filtered by assignmentId
     */
    List<TimeSlot> listSlotsByExaminer(@Param("examinerId") Long examinerId,
                                       @Param("assignmentId") Long assignmentId);

    int batchInsert(@Param("list") java.util.List<TimeSlotExaminer> list);
}
