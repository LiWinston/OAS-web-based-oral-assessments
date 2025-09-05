package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.annotation.Log;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.dto.request.AddAssignmentMemberRequestDTO;
import org.swen90017.oas.dto.response.AssignmentMemberCreateResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberListResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberRemoveResponseDTO;
import org.swen90017.oas.enums.BusinessType;
import org.swen90017.oas.service.AssignmentMemberService;

import javax.validation.Valid;

@Tag(name = "Assignment Member Management", description = "List, add and remove assignment members")
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentMemberController {

    private final AssignmentMemberService assignmentMemberService;

    @GetMapping("/{assignmentId}/members")
    @Operation(summary = "List assignment members", description = "List assignment members with optional role filter, search and pagination")
    @Log(module = "Assignment Member Management", businessType = BusinessType.QUERY)
    public Result<AssignmentMemberListResponseDTO> listMembers(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Role filter: ROLE_STUDENT or ROLE_EXAMINER") @RequestParam(required = false) String role,
            @Parameter(description = "Search by email or fullName") @RequestParam(required = false) String q,
            @Parameter(description = "Zero-based page number") @RequestParam(required = false, defaultValue = "0") Integer pageNum,
            @Parameter(description = "Page size") @RequestParam(required = false, defaultValue = "25") Integer pageSize
    ) {
        AssignmentMemberListResponseDTO data = assignmentMemberService.listMembers(assignmentId, role, q, pageNum, pageSize);
        return Result.success(data);
    }

    @PostMapping("/{assignmentId}/members")
    @Operation(summary = "Add assignment member", description = "Add a student or examiner by email; creates account if needed and links to assignment")
    @Log(module = "Assignment Member Management", businessType = BusinessType.INSERT)
    public Result<AssignmentMemberCreateResponseDTO> addMember(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Valid @RequestBody AddAssignmentMemberRequestDTO request
    ) {
        AssignmentMemberCreateResponseDTO data = assignmentMemberService.addMember(assignmentId, request);
        return Result.success(data);
    }

    @DeleteMapping("/{assignmentId}/members/{assignmentUserId}")
    @Operation(summary = "Remove assignment member", description = "Remove an assignment member and cascade: cancel student bookings or clear examiner slots")
    @Log(module = "Assignment Member Management", businessType = BusinessType.DELETE)
    public Result<AssignmentMemberRemoveResponseDTO> removeMember(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId,
            @Parameter(description = "Membership id") @PathVariable Long assignmentUserId
    ) {
        AssignmentMemberRemoveResponseDTO data = assignmentMemberService.removeMember(assignmentId, assignmentUserId);
        return Result.success(data);
    }
}


