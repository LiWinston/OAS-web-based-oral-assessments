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
import org.swen90017.oas.dto.request.UpdateSessionsExaminersRequestDTO;
import org.swen90017.oas.dto.response.*;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.service.ExaminerSelfService;
import org.swen90017.oas.service.SessionService;

import javax.validation.Valid;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "Examiner Self Assignment", description = "Examiner self-service APIs for selecting time slots")
@RestController
public class ExaminerController {

    @Autowired
    private ExaminerSelfService examinerSelfService;
    @Autowired
    private SessionService sessionService;
    @Operation(summary = "List sessions for examiner")
    @GetMapping("/api/examiners/{examinerId}/assignments/{assignmentId}/sessions")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<AdminSessionsListResponseDTO> listForExaminer(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "venueId", required = false) Long venueId,
            @RequestParam(value = "status", required = false) String status) {
        // 最小校验与日志
        try {
            return Result.success(sessionService.listAdminSessions(assignmentId, date, status, venueId));
        } catch (Exception e) {
            throw new BusinessException(BusinessError.INVALID_PARAM);
        }
    }

    @Operation(summary = "Batch self-assign sessions")
    @PostMapping("/api/assignments/{assignmentId}/sessions/assign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.UPDATE)
    public Result<Map<String,Object>> batchSelfAssign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestBody Map<String, List<Long>> body,
            @RequestParam("examinerId") Long examinerId) {
        UpdateSessionsExaminersRequestDTO req = new UpdateSessionsExaminersRequestDTO();
        req.setSessionIds(body.getOrDefault("sessionIds", Collections.emptyList()));
        req.setExaminerIds(Collections.singletonList(examinerId));
        req.setAction("add");
        return Result.success(sessionService.updateSessionsExaminers(assignmentId, req));
    }

    @Operation(summary = "Self unassign a session")
    @DeleteMapping("/api/assignments/{assignmentId}/sessions/{sessionId}/unassign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.DELETE)
    public Result<Map<String,Object>> selfUnassign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Session ID") @PathVariable Long sessionId,
            @RequestParam("examinerId") Long examinerId) {
        boolean ok = sessionService.unassignExaminer(sessionId, examinerId);
        Map<String,Object> resp = new HashMap<>();
        resp.put("sessionId", sessionId);
        resp.put("success", ok);
        return Result.success(resp);
    }

    @Operation(summary = "List assignments available to examiner")
    @GetMapping("/api/examiners/{examinerId}/assignments")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<List<AssignmentResponseDTO>> listAssignments(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @Parameter(description = "Course ID filter") @RequestParam(value = "courseId", required = false) Long courseId,
            @Parameter(description = "Sort order") @RequestParam(value = "sort", required = false, defaultValue = "date_desc") String sort) {
        return Result.success(examinerSelfService.listAssignmentsAvailable(examinerId, courseId, sort));
    }

    @Operation(summary = "List time slots for selection")
    @GetMapping("/api/assignments/{assignmentId}/timeslots")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<TimeSlotsSelectionResponseDTO> listSelectable(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam("examinerId") Long examinerId,
            @Parameter(description = "Filter by date (YYYY-MM-DD)") @RequestParam(value = "date", required = false) String date,
            @Parameter(description = "Include full slots") @RequestParam(value = "includeFullSlots", required = false, defaultValue = "true") Boolean includeFullSlots) {
        return Result.success(examinerSelfService.listSelectableTimeSlots(assignmentId, examinerId, date, includeFullSlots));
    }

    @Operation(summary = "Assign examiner to time slots in bulk (partial success supported)")
    @PostMapping("/api/assignments/{assignmentId}/timeslots/assign")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.UPDATE)
    public Result<PartialAssignmentResultDTO> bulkAssign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody ExaminerBulkAssignRequestDTO request) {
        return Result.success(examinerSelfService.bulkAssign(assignmentId, request));
    }

    @Operation(summary = "Get examiner schedule")
    @GetMapping("/api/examiners/{examinerId}/schedule")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<ExaminerScheduleResponseDTO> schedule(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId,
            @RequestParam(value = "assignmentId", required = false) Long assignmentId) {
        return Result.success(examinerSelfService.getScheduleV2(examinerId, assignmentId));
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
}


