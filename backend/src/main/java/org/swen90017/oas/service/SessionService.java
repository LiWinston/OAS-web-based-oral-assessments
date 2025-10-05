package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.dto.request.SessionRequestDTO;
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.dto.response.AdminSessionsListResponseDTO;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.dto.response.SessionDetailDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface SessionService {
    boolean assignExaminer(Long sessionId, Long examinerId, Long operatorId);
    boolean unassignExaminer(Long sessionId, Long examinerId);
    List<Long> findConflictsForExaminer(Long examinerId, LocalDateTime startAt, LocalDateTime endAt);
    List<Long> listExaminerIds(Long sessionId);

    int batchCreateSessions(Long assignmentId, List<BatchCreateSessionsRequestDTO.SessionWindowDTO> windows);

    // overlap + CRUD for admin
    AdminSessionsListResponseDTO listAdminSessions(Long assignmentId, String date, String status, Long venueId, String q);
    
    // examiner-specific session listing
    AdminSessionsListResponseDTO listExaminerSessions(Long examinerId, Long assignmentId, String date, String status, Long venueId);
    SessionDetailDTO updateSession(Long assignmentId, Long sessionId, SessionRequestDTO request);
    Map<String, Object> deleteSessions(Long assignmentId, List<Long> sessionIds);
    Map<String, Object> updateSessionsExaminers(Long assignmentId, UpdateSessionsExaminersRequestDTO request);

    // publish controls
    boolean publishSessionToExaminer(Long sessionId, boolean value);
    boolean publishSessionToStudent(Long sessionId, boolean value);

    Map<String, Boolean> getPublishStatus(Long sessionId);

    // Assignment-level publish controls
    boolean publishAssignmentToExaminer(Long assignmentId, boolean value);
    boolean publishAssignmentToStudent(Long assignmentId, boolean value);

    CalendarResponseDTO getSessionCalendar(Long assignmentId, String month);

    Map<String, Object> getAssignmentPublishStatus(Long assignmentId);
}


