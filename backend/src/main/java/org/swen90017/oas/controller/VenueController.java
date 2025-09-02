package org.swen90017.oas.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.swen90017.oas.common.Result;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.service.VenueService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class VenueController {
    @Autowired
    private VenueService venueService;

    @Operation(summary = "Create a venue")
    @PostMapping("/venues")
    public Result<Venue> create(@RequestBody Venue venue) {
        return Result.success(venueService.createVenue(venue));
    }

    @Operation(summary = "List venues by assignment")
    @GetMapping("/assignments/{assignmentId}/venues")
    public Result<List<Venue>> listByAssignment(
            @Parameter(description = "Assignment ID") @PathVariable Long assignmentId) {
        return Result.success(venueService.listByAssignmentId(assignmentId));
    }
}