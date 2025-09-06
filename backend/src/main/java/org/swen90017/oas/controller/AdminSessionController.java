package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.BatchCreateSessionsRequestDTO;
import org.swen90017.oas.dto.request.AssignSessionExaminersRequestDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.SessionService;

import javax.validation.Valid;
import java.util.List;

@Tag(name = "Admin Session Management", description = "Admin operations for session-level settings and assignments")
@RestController
@RequestMapping("/api/admin/sessions")
@RequiredArgsConstructor
public class AdminSessionController {

    private final SessionService sessionService;

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
    @PostMapping("/assignments/{assignmentId}/batch-create")
    @Log(module = "Session Management", businessType = BusinessType.INSERT)
    public Result<Integer> batchCreate(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody BatchCreateSessionsRequestDTO request) {
        int created = sessionService.batchCreateSessions(assignmentId, request.getWindows());
        return Result.success(created);
    }
}


