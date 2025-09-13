package org.swen90017.oas.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.swen90017.oas.entity.AssessmentSubmission;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AssessmentSubmissionMapper extends BaseMapper<AssessmentSubmission> {

    AssessmentSubmission selectByUniqueTarget(@Param("assignmentId") Long assignmentId,
                                              @Param("sessionId") Long sessionId,
                                              @Param("subjectType") String subjectType,
                                              @Param("subjectId") Long subjectId,
                                              @Param("examinerId") Long examinerId);

    List<AssessmentSubmission> listByExaminer(@Param("examinerId") Long examinerId,
                                              @Param("assignmentId") Long assignmentId,
                                              @Param("status") String status,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);
}


