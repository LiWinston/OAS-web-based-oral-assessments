package org.swen90017.oas.service;

import org.swen90017.oas.entity.Venue;

import java.util.List;

public interface VenueService {
    Venue createVenue(Venue venue);

    List<Venue> listByAssignmentId(Long assignmentId);
}
