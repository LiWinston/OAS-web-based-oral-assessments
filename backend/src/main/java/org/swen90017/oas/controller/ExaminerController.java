package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.BusinessError;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ExaminerBulkAssignRequestDTO;
import org.swen90017.oas.dto.request.ExaminerBatchSelfAssignRequestDTO;
import org.swen90017.oas.dto.request.ExaminerListSessionsRequestDTO;
import org.swen90017.oas.dto.request.ExaminerListSelectableRequestDTO;
import org.swen90017.oas.dto.request.ExaminerScheduleQueryDTO;
import org.swen90017.oas.dto.request.ExaminerSelfUnassignRequestDTO;
import org.swen90017.oas.dto.request.ExaminerSessionStudentsRequestDTO;
import org.swen90017.oas.dto.request.ListAssignmentsRequestDTO;
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.service.ExaminerSelfService;
import org.swen90017.oas.service.SessionService;

import javax.validation.Valid;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Tag(name = "Examiner Self Assignment", description = "Examiner self-service APIs for selecting time slots")
@RestController
public class ExaminerController {

    @Autowired
    private ExaminerSelfService examinerSelfService;
    @Autowired
    private SessionService sessionService;
    @Operation(summary = "List sessions for examiner", description = "Query with filters via DTO")
    @PostMapping("/api/examiners/{examinerId}/assignments/{assignmentId}/sessions/query")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<AdminSessionsListResponseDTO> listForExaminer(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestBody ExaminerListSessionsRequestDTO request) {
        try {
            return Result.success(sessionService.listAdminSessions(assignmentId, request.getDate(), request.getStatus(), request.getVenueId()));
        } catch (Exception e) {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }
    }

    @Operation(summary = "Batch self-assign sessions", description = "Assign examiner to multiple sessions using DTO")
    @PostMapping("/api/assignments/{assignmentId}/sessions/assign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.UPDATE)
    public Result<UpdateSessionsResultDTO> batchSelfAssign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ExaminerBatchSelfAssignRequestDTO body) {
        UpdateSessionsExaminersRequestDTO req = new UpdateSessionsExaminersRequestDTO();
        req.setSessionIds(body.getSessionIds() == null ? Collections.emptyList() : body.getSessionIds());
        req.setExaminerIds(Collections.singletonList(body.getExaminerId()));
        req.setAction("add");
        Map<String,Object> map = sessionService.updateSessionsExaminers(assignmentId, req);
        UpdateSessionsResultDTO resp = new UpdateSessionsResultDTO();
        Object ids = map == null ? null : map.get("updatedSessionIds");
        if (ids instanceof List) {
            @SuppressWarnings("unchecked") List<Long> list = (List<Long>) ids;
            resp.setUpdatedSessionIds(list);
        }
        return Result.success(resp);
    }

    @Operation(summary = "Self unassign a session", description = "Use DTO and POST to unassign")
    @PostMapping("/api/assignments/{assignmentId}/sessions/unassign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.DELETE)
    public Result<SelfUnassignResultDTO> selfUnassign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ExaminerSelfUnassignRequestDTO request) {
        boolean ok = sessionService.unassignExaminer(request.getSessionId(), request.getExaminerId());
        SelfUnassignResultDTO resp = new SelfUnassignResultDTO();
        resp.setSessionId(request.getSessionId());
        resp.setSuccess(ok);
        return Result.success(resp);
    }

    @Operation(summary = "List assignments available to examiner", description = "Query via DTO")
    @PostMapping("/api/examiners/assignments/list")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<List<AssignmentResponseDTO>> listAssignments(@Valid @RequestBody ListAssignmentsRequestDTO request) {
        return Result.success(examinerSelfService.listAssignmentsAvailable(request.getExaminerId(), request.getCourseId(), request.getSort()));
    }

    @Operation(summary = "List time slots for selection", description = "Query via DTO")
    @PostMapping("/api/assignments/{assignmentId}/timeslots/query")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<TimeSlotsSelectionResponseDTO> listSelectable(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ExaminerListSelectableRequestDTO request) {
        return Result.success(examinerSelfService.listSelectableTimeSlots(assignmentId, request.getExaminerId(), request.getDate(), request.getIncludeFullSlots()));
    }

    @Operation(summary = "Assign examiner to time slots in bulk (partial success supported)")
    @PostMapping("/api/assignments/{assignmentId}/timeslots/assign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.UPDATE)
    public Result<PartialAssignmentResultDTO> bulkAssign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ExaminerBulkAssignRequestDTO request) {
        return Result.success(examinerSelfService.bulkAssign(assignmentId, request));
    }

    @Operation(summary = "Get examiner schedule", description = "Query via DTO")
    @PostMapping("/api/examiners/{examinerId}/schedule")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<ExaminerScheduleResponseDTO> schedule(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Valid @RequestBody ExaminerScheduleQueryDTO request) {
        return Result.success(examinerSelfService.getScheduleV2(examinerId, request.getAssignmentId()));
    }

    @Operation(summary = "Unassign examiner from time slot")
    @DeleteMapping("/api/assignments/{assignmentId}/timeslots/{slotId}/unassign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.DELETE)
    public Result<ExaminerUnassignResponseDTO> unassign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Time Slot ID") @PathVariable Long slotId,
            @RequestParam("examinerId") Long examinerId) {
        ExaminerUnassignResponseDTO response = examinerSelfService.unassign(assignmentId, slotId, examinerId);
        return Result.success(response);
    }

    @Operation(summary = "Claim a session by examiner")
    @PostMapping("/api/examiners/{examinerId}/sessions/{sessionId}/claim")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.UPDATE)
    public Result<Boolean> claimSession(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId) {
        Boolean ok = sessionService.assignExaminer(sessionId, examinerId, examinerId);
        return Result.success(ok);
    }

    @Operation(summary = "Unclaim a session by examiner")
    @DeleteMapping("/api/examiners/{examinerId}/sessions/{sessionId}/claim")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.DELETE)
    public Result<Boolean> unclaimSession(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId) {
        Boolean ok = sessionService.unassignExaminer(sessionId, examinerId);
        return Result.success(ok);
    }

    @Operation(summary = "Get session students and groups", description = "Get all students and groups enrolled in a specific session")
    @PostMapping("/api/sessions/students")
    @Log(module = "Examiner Session Management", businessType = BusinessType.QUERY)
    public Result<SessionStudentsResponseDTO> getSessionStudents(
            @Valid @RequestBody ExaminerSessionStudentsRequestDTO request) {
        try {
            SessionStudentsResponseDTO response = examinerSelfService.getSessionStudents(request.getSessionId());
            return Result.success(response);
        } catch (Exception e) {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }
    }
}


