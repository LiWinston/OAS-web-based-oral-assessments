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

    // overlap + CRUD for admin
    org.swen90017.oas.dto.response.AdminSessionsListResponseDTO listAdminSessions(Long assignmentId, String date, String status, Long venueId);
    org.swen90017.oas.dto.response.SessionDetailDTO updateSession(Long assignmentId, Long sessionId, org.swen90017.oas.dto.request.SessionRequestDTO request);
    java.util.Map<String, Object> deleteSessions(Long assignmentId, java.util.List<Long> sessionIds);
    java.util.Map<String, Object> updateSessionsExaminers(Long assignmentId, org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO request);

    // publish controls
    boolean publishSessionToExaminer(Long sessionId, boolean value);
    boolean publishSessionToStudent(Long sessionId, boolean value);
}


