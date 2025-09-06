package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface SessionService {
    boolean assignExaminer(Long sessionId, Long examinerId, Long operatorId);
    boolean unassignExaminer(Long sessionId, Long examinerId);
    List<Long> findConflictsForExaminer(Long examinerId, LocalDateTime startAt, LocalDateTime endAt);
    List<Long> listExaminerIds(Long sessionId);

    int batchCreateSessions(Long assignmentId, List<BatchCreateSessionsRequestDTO.SessionWindowDTO> windows);
}


