package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.ExaminerBulkAssignRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleResponseDTO;
import org.swen90017.oas.dto.response.PartialAssignmentResultDTO;
import org.swen90017.oas.dto.response.SelectableTimeSlotDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.ExaminerSelfService;

import javax.validation.Valid;
import java.util.List;

@Tag(name = "Examiner Self Assignment", description = "Examiner self-service APIs for selecting time slots")
@RestController
public class ExaminerController {

    @Autowired
    private ExaminerSelfService examinerSelfService;

    @Operation(summary = "List assignments available to examiner")
    @GetMapping("/api/examiners/{examinerId}/assignments")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<List<AssignmentResponseDTO>> listAssignments(
            @Parameter(description = "Examiner ID") @PathVariable Long examinerId) {
        return Result.success(examinerSelfService.listAssignmentsAvailable(examinerId));
    }

    @Operation(summary = "List time slots for selection")
    @GetMapping("/api/assignments/{assignmentId}/timeslots")
    @Log(module = "Examiner Self Assignment", businessType = BusinessType.QUERY)
    public Result<List<SelectableTimeSlotDTO>> listSelectable(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @RequestParam("examinerId") Long examinerId) {
        return Result.success(examinerSelfService.listSelectableTimeSlots(assignmentId, examinerId));
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
    public Result<Boolean> unassign(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Time Slot ID") @PathVariable Long slotId,
            @RequestParam("examinerId") Long examinerId) {
        examinerSelfService.unassign(assignmentId, slotId, examinerId);
        return Result.success(true);
    }
}


