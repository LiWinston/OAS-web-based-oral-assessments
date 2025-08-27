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
    int book(@Param("sessionId") Long sessionId,
             @Param("bookedSubjectId") Long bookedSubjectId,
             @Param("bookedSubjectType") String bookedSubjectType);

    int unbook(@Param("sessionId") Long sessionId);

    int countBookedBySlot(@Param("slotId") Long slotId);
}
