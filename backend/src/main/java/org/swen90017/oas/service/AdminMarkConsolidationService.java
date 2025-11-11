package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.MarkConsolidationAlertsResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationOverviewResponseDTO;
import org.swen90017.oas.dto.response.MarkConsolidationTrendsResponseDTO;

import java.time.LocalDate;
import java.util.Set;

public interface AdminMarkConsolidationService {

    MarkConsolidationOverviewResponseDTO getOverview(Long subjectId,
                                                     Long assignmentId,
                                                     Long sessionId,
                                                     boolean includeProgressBreakdown);

    MarkConsolidationTrendsResponseDTO getTrends(Long subjectId,
                                                 Long assignmentId,
                                                 Long sessionId,
                                                 LocalDate rangeStart,
                                                 LocalDate rangeEnd,
                                                 String interval);

    MarkConsolidationAlertsResponseDTO getAlerts(Long subjectId,
                                                 Long assignmentId,
                                                 Long sessionId,
                                                 Set<String> types,
                                                 int limit);
}
