package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.dto.request.GenerateSessionsRequestDTO;
import org.swen90017.oas.dto.request.SessionRequestDTO;
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.dto.response.AdminSessionsListResponseDTO;
import org.swen90017.oas.dto.request.AssignSessionExaminersRequestDTO;
import org.swen90017.oas.dto.response.CalendarResponseDTO;
import org.swen90017.oas.dto.response.ResultBatchCreateSessionsResponseDTO;
import org.swen90017.oas.dto.response.SessionDetailDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.enums.SessionStatus;
import org.swen90017.oas.service.SessionService;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Tag(name = "Admin Session Management", description = "Admin operations for session-level settings and assignments")
@RestController
@RequestMapping("/api/admin/sessions")
@RequiredArgsConstructor
public class AdminSessionController {

    private final SessionService sessionService;

    @Operation(summary = "List sessions for assignment")
    @GetMapping("/assignments/{assignmentId}/sessions")
        @Log(module = "Session Management", businessType = BusinessType.QUERY)
    public Result<AdminSessionsListResponseDTO> listSessions(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam(value = "date") String date,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "venueId", required = false) Long venueId,
            @RequestParam(value = "q", required = false) String q) {
        return Result.success(sessionService.listAdminSessions(assignmentId, date, status, venueId, q));
    }

    @Operation(summary = "Get session calendar (assignment)", description = "Aggregate session data per day for given month")
    @GetMapping("/assignments/{assignmentId}/calendar")
    @Log(module = "Session Calendar", businessType = BusinessType.QUERY)
    public Result<CalendarResponseDTO> getSessionCalendar(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Target month YYYY-MM") @RequestParam String month) {
        return Result.success(sessionService.getSessionCalendar(assignmentId, month));
    }

    @Operation(summary = "List examiners assigned to a session")
    @GetMapping("/{sessionId}/examiners")
    @Log(module = "Session Management", businessType = BusinessType.QUERY)
    public Result<List<Long>> listExaminers(
            @Parameter(description = "Session ID") @PathVariable Long sessionId) {
        return Result.success(sessionService.listExaminerIds(sessionId));
    }

    @Operation(summary = "Assign examiners to a session")
    @PostMapping("/{sessionId}/examiners")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Integer> assign(
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @Valid @RequestBody AssignSessionExaminersRequestDTO request) {
        int success = 0;
        for (Long examinerId : request.getExaminerIds()) {
            if (Boolean.TRUE.equals(sessionService.assignExaminer(sessionId, examinerId, null))) {
                success++;
            }
        }
        return Result.success(success);
    }

    @Operation(summary = "Unassign an examiner from a session")
    @DeleteMapping("/{sessionId}/examiners/{examinerId}")
    @Log(module = "Session Management", businessType = BusinessType.DELETE)
    public Result<Boolean> unassign(
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId) {
        return Result.success(sessionService.unassignExaminer(sessionId, examinerId));
    }

    @Operation(summary = "Batch create sessions (no timeslot)")
    @PostMapping("/assignments/{assignmentId}/sessions/batch")
    @Log(module = "Session Management", businessType = BusinessType.INSERT)
    public Result<ResultBatchCreateSessionsResponseDTO> batchCreate(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody BatchCreateSessionsRequestDTO request) {
        int created = sessionService.batchCreateSessions(assignmentId, request.getWindows());
        ResultBatchCreateSessionsResponseDTO dto = new ResultBatchCreateSessionsResponseDTO();
        dto.setCreatedCount(created);

        // Aggregate sessions for each window on the same date/venue whose time falls within the window
        List<SessionDetailDTO> details = new ArrayList<>();
        for (BatchCreateSessionsRequestDTO.SessionWindowDTO w : request.getWindows()) {
            AdminSessionsListResponseDTO day = sessionService.listAdminSessions(assignmentId, w.getDate().toString(), null, w.getVenueId(), null);
            if (day == null || day.getSessions() == null) continue;
            for (AdminSessionsListResponseDTO.Item it : day.getSessions()) {
                java.time.LocalTime st = it.getStartTime();
                if ((st.equals(w.getStartTime()) || st.isAfter(w.getStartTime())) && (st.equals(w.getEndTime()) || st.isBefore(w.getEndTime()))) {
                    SessionDetailDTO s = new SessionDetailDTO();
                    s.setId(it.getId());
                    s.setStartTime(it.getStartTime());
                    s.setEndTime(it.getEndTime());
                    s.setStatus(SessionStatus.valueOf(it.getStatus().toUpperCase()));
                    s.setSessionNumber(null);
                    s.setBookedBy(null);
                    details.add(s);
                }
            }
        }
        dto.setSessions(details);
        return Result.success(dto);
    }

    @Operation(summary = "Generate sessions (length+gap)")
    @PostMapping("/assignments/{assignmentId}/sessions/generate")
    @Log(module = "Session Management", businessType = BusinessType.INSERT)
    public Result<ResultBatchCreateSessionsResponseDTO> generate(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody GenerateSessionsRequestDTO request) {
        // Convert generator params into windows, then reuse batchCreateSessions
        List<BatchCreateSessionsRequestDTO.SessionWindowDTO> windows = new ArrayList<>();
        LocalDateTime cursor = request.getDate().atTime(request.getStartTime());
        for (int i = 0; i < request.getCount(); i++) {
            BatchCreateSessionsRequestDTO.SessionWindowDTO w = new BatchCreateSessionsRequestDTO.SessionWindowDTO();
            w.setDate(cursor.toLocalDate());
            w.setStartTime(cursor.toLocalTime());
            LocalDateTime end = cursor.plusMinutes(request.getLength());
            w.setEndTime(end.toLocalTime());
            w.setSessionCount(1);
            w.setVenueId(request.getVenueId());
            w.setRequiredExaminers(request.getRequiredExaminers());
            w.setCapacity(request.getCapacity());
            windows.add(w);
            cursor = end.plusMinutes(request.getGapTime() == null ? 0 : request.getGapTime());
        }
        int created = sessionService.batchCreateSessions(assignmentId, windows);
        org.swen90017.oas.dto.response.ResultBatchCreateSessionsResponseDTO dto = new org.swen90017.oas.dto.response.ResultBatchCreateSessionsResponseDTO();
        dto.setCreatedCount(created);

        // Return details of newly generated sessions: filter same-day sessions by generated start times
        Set<LocalTime> generatedStarts = new HashSet<>();
        for (BatchCreateSessionsRequestDTO.SessionWindowDTO w : windows) {
            generatedStarts.add(w.getStartTime());
        }
        AdminSessionsListResponseDTO adminList = sessionService.listAdminSessions(assignmentId, request.getDate().toString(), null, request.getVenueId(), null);
        List<SessionDetailDTO> details = new ArrayList<>();
        if (adminList != null && adminList.getSessions() != null) {
            for (AdminSessionsListResponseDTO.Item it : adminList.getSessions()) {
                if (!generatedStarts.contains(it.getStartTime())) continue;
                SessionDetailDTO s = new SessionDetailDTO();
                s.setId(it.getId());
                s.setStartTime(it.getStartTime());
                s.setEndTime(it.getEndTime());
                s.setStatus(SessionStatus.valueOf(it.getStatus().toUpperCase()));
                s.setSessionNumber(null);
                s.setBookedBy(null);
                details.add(s);
            }
        }
        dto.setSessions(details);
        return Result.success(dto);
    }

    @Operation(summary = "Update single session")
    @PutMapping("/assignments/{assignmentId}/sessions/{sessionId}")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<SessionDetailDTO> updateSession(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @Valid @RequestBody SessionRequestDTO request) {
        return Result.success(sessionService.updateSession(assignmentId, sessionId, request));
    }

    @Operation(summary = "Delete sessions in batch")
    @DeleteMapping("/assignments/{assignmentId}/sessions")
    @Log(module = "Session Management", businessType = BusinessType.DELETE)
    public Result<Map<String,Object>> deleteSessions(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("sessionIds", Collections.emptyList());
        try {
            return Result.success(sessionService.deleteSessions(assignmentId, ids));
        } catch (org.swen90017.oas.exception.BusinessException ex) {
            if (org.swen90017.oas.common.BusinessError.SESSION_HAS_BOOKINGS.getCode().equals(ex.getCode())) {
                Map<String,Object> err = new java.util.HashMap<>();
                err.put("blockedSessionIds", ids);
                throw ex;
            }
            throw ex;
        }
    }

    @Operation(summary = "Add examiners to sessions")
    @PutMapping("/assignments/{assignmentId}/sessions/examiners/add")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Map<String,Object>> addExaminers(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateSessionsExaminersRequestDTO request) {
        request.setAction("add");
        return Result.success(sessionService.updateSessionsExaminers(assignmentId, request));
    }

    @Operation(summary = "Remove examiners from sessions")
    @PutMapping("/assignments/{assignmentId}/sessions/examiners/remove")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Map<String,Object>> removeExaminers(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateSessionsExaminersRequestDTO request) {
        request.setAction("remove");
        return Result.success(sessionService.updateSessionsExaminers(assignmentId, request));
    }

    @Operation(summary = "Set examiners for sessions (overwrite)")
    @PutMapping("/assignments/{assignmentId}/sessions/examiners/set")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Map<String,Object>> setExaminers(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody UpdateSessionsExaminersRequestDTO request) {
        request.setAction("set");
        return Result.success(sessionService.updateSessionsExaminers(assignmentId, request));
    }

    @Operation(summary = "Publish/unpublish ALL sessions of an assignment to examiner")
    @PutMapping("/assignments/{assignmentId}/publish/examiner")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Boolean> publishAssignmentToExaminer(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam("value") Boolean value) {
        return Result.success(sessionService.publishAssignmentToExaminer(assignmentId, Boolean.TRUE.equals(value)));
    }

    @Operation(summary = "Publish/unpublish ALL sessions of an assignment to student (requires all staffed)")
    @PutMapping("/assignments/{assignmentId}/publish/student")
    @Log(module = "Session Management", businessType = BusinessType.UPDATE)
    public Result<Boolean> publishAssignmentToStudent(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam("value") Boolean value) {
        return Result.success(sessionService.publishAssignmentToStudent(assignmentId, Boolean.TRUE.equals(value)));
    }

    @Operation(summary = "Get publish status for a session")
    @GetMapping("/sessions/{sessionId}/publish/status")
    @Log(module = "Session Management", businessType = BusinessType.QUERY)
    public Result<Map<String, Boolean>> getPublishStatus(
            @Parameter(description = "Session ID") @PathVariable Long sessionId) {
        return Result.success(sessionService.getPublishStatus(sessionId));
    }

    @Operation(summary = "Get assignment publish status")
    @GetMapping("/assignments/{assignmentId}/publish/status")
    @Log(module = "Session Management", businessType = BusinessType.QUERY)
    public Result<Map<String, Object>> getAssignmentPublishStatus(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        return Result.success(sessionService.getAssignmentPublishStatus(assignmentId));
    }
}


