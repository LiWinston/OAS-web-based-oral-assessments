package org.swen90017.oas.dto.profile;

import lombok.Data;

@Data
public class SuperAdminMetricsSummary {
    private Integer pendingAdminApprovals;
    private Integer activeCourses;
    private Integer newUsers7d;
    private Integer totalUsers;
}
