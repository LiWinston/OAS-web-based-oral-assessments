package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.CsvImportHistory;

import java.util.List;

/**
 * CSV Import History Mapper
 */
@Mapper
public interface CsvImportHistoryMapper extends BaseMapper<CsvImportHistory> {

    /**
     * Query history by importer ID
     */
    List<CsvImportHistory> selectByImporterId(@Param("importerId") Long importerId);

    /**
     * Query history by import type
     */
    List<CsvImportHistory> selectByImportType(@Param("importType") String importType);

    /**
     * Query history by assignment ID
     */
    List<CsvImportHistory> selectByAssignmentId(@Param("assignmentId") Long assignmentId);

    /**
     * Query all history ordered by create time desc
     */
    List<CsvImportHistory> selectAllOrderByCreateTime();
}

