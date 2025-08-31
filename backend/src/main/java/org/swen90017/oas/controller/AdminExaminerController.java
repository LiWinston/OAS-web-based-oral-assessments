package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.AssignExaminersRequestDTO;
import org.swen90017.oas.dto.response.GetAvailableExaminersResponseDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AdminExaminerService;

import javax.validation.Valid;

@Tag(name = "Admin Examiner Management", description = "Admin APIs for examiner listing, session limits and assignment")
@RestController
@RequestMapping("/api/admin/assignments")
public class AdminExaminerController {
    @Autowired
    private AdminExaminerService adminExaminerService;
    @Operation(summary = "Get available examiners", description = "List examiners, their current load and availability")
    @GetMapping("/{assignmentId}/examiners")
    @Log(module = "Examiner Management", businessType = BusinessType.QUERY)
    public Result<GetAvailableExaminersResponseDTO> getAvailableExaminers(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Optional Time Slot ID for conflict check") @RequestParam(required = false) Long timeSlotId) {
        GetAvailableExaminersResponseDTO resp = adminExaminerService.getAvailableExaminers(assignmentId, timeSlotId);
        return Result.success(resp);
    }

    /**
     * Assign Examiners to Time Slot
     * Post /admin/assignments/{assignmentId}/timeslots/{timeSlotId}/examiners
     */
    @Operation(summary = "Assign examiners to a time slot", description = "Admin assigns examiners at time slot level")
    @PostMapping("/{assignmentId}/timeslots/{timeSlotId}/examiners")
    @Log(module = "Examiner Management", businessType = BusinessType.UPDATE)
    public Result<TimeSlotDetailDTO> assignExaminersToSlot(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Time Slot ID") @PathVariable Long timeSlotId,
            @Valid @RequestBody AssignExaminersRequestDTO request) {
        TimeSlotDetailDTO dto = adminExaminerService.assignExaminersToSlot(assignmentId, timeSlotId, request);
        return Result.success(dto);
    }

}
