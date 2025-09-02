package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.service.VenueService;

import java.util.List;

@Service
public class VenueServiceImpl implements VenueService {
    @Autowired
    private VenueMapper venueMapper;

    @Override
    public Venue createVenue(Venue venue) {
        if (venue == null) return null;
        venueMapper.insert(venue);
        return venueMapper.selectById(venue.getId());
    }

    @Override
    public List<Venue> listByAssignmentId(Long assignmentId) {
        return venueMapper.listByAssignmentId(assignmentId);
    }
}
