package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.SysExaminer;

import java.util.List;
@Mapper
public interface ExaminerMapper extends BaseMapper<SysExaminer> {
    void batchInsert(@Param("list") List<SysExaminer> sysExaminers);
}
