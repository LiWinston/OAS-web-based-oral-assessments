package org.swen90017.oas.service.impl;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.swen90017.oas.dto.profile.AdminCourseSummary;
import org.swen90017.oas.dto.profile.AdminTaskSummary;
import org.swen90017.oas.dto.profile.RoleWidgetItem;
import org.swen90017.oas.dto.profile.SessionSummaryDto;
import org.swen90017.oas.dto.profile.SuperAdminMetricsSummary;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.mapper.ProfileWidgetMapper;
import org.swen90017.oas.service.ProfileWidgetService;

@Service
@RequiredArgsConstructor
public class ProfileWidgetServiceImpl implements ProfileWidgetService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("EEE d MMM HH:mm", Locale.ENGLISH);
    private final ProfileWidgetMapper profileWidgetMapper;

    @Override
    public List<RoleWidgetItem> buildWidgets(SysUser user, String roleKey) {
        if (roleKey == null) {
            return Collections.emptyList();
        }
        switch (roleKey) {
            case "ROLE_STUDENT":
                return buildStudentWidgets(user.getUserId());
            case "ROLE_EXAMINER":
                return buildExaminerWidgets(user.getUserId());
            case "ROLE_ADMIN":
                return buildCourseAdminWidgets(user.getUserId());
            case "ROLE_SUPER_ADMIN":
                return buildSuperAdminWidgets();
            default:
                return Collections.emptyList();
        }
    }

    private List<RoleWidgetItem> buildStudentWidgets(Long userId) {
        List<RoleWidgetItem> items = new ArrayList<>();
        SessionSummaryDto upcoming = profileWidgetMapper.findStudentNextSession(userId);
        items.add(createSessionItem("student.nextSession", "Next Session", upcoming,
                upcoming != null ? "Be ready for your next oral exam." : "No upcoming bookings"));

        List<SessionSummaryDto> recent = profileWidgetMapper.findStudentRecentSessions(userId, 3);
        items.add(createSessionListItem("student.recentSessions", "Recent Sessions", recent,
                recent.isEmpty() ? "No recent bookings" : "Latest completed bookings"));
        return items;
    }

    private List<RoleWidgetItem> buildExaminerWidgets(Long userId) {
        List<RoleWidgetItem> items = new ArrayList<>();
        SessionSummaryDto next = profileWidgetMapper.findExaminerNextSession(userId);
        items.add(createSessionItem("examiner.nextSession", "Upcoming Allocation", next,
                next != null ? "Prepare for your next assessment." : "No upcoming allocations"));

        List<SessionSummaryDto> recent = profileWidgetMapper.findExaminerRecentSessions(userId, 3);
        items.add(createSessionListItem("examiner.recentSessions", "Recent Sessions", recent,
                recent.isEmpty() ? "No recent sessions" : "Latest sessions you've attended"));
        return items;
    }

    private List<RoleWidgetItem> buildCourseAdminWidgets(Long userId) {
        List<RoleWidgetItem> items = new ArrayList<>();
        List<AdminCourseSummary> courses = profileWidgetMapper.findAdminCourseSummaries(userId, 3);
        List<Map<String, Object>> coursePayload = new ArrayList<>();
        for (AdminCourseSummary course : courses) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("subjectId", course.getSubjectId());
            row.put("subjectCode", course.getSubjectCode());
            row.put("subjectName", course.getSubjectName());
            row.put("status", course.getStatus());
            row.put("assignmentCount", course.getAssignmentCount());
            row.put("unstaffedSessions", course.getUnstaffedSessions());
            coursePayload.add(row);
        }
        items.add(RoleWidgetItem.builder()
                .key("admin.managedCourses")
                .title("Managed Courses")
                .description(courses.isEmpty() ? "No courses assigned" : "Snapshot of your active courses")
                .payload(Collections.singletonMap("courses", coursePayload))
                .build());

        AdminTaskSummary taskSummary = profileWidgetMapper.findAdminTaskSummary(userId);
        Map<String, Object> taskPayload = new LinkedHashMap<>();
        if (taskSummary != null) {
            taskPayload.put("unstaffedSessions", taskSummary.getUnstaffedSessions());
            taskPayload.put("openSessions", taskSummary.getOpenSessions());
            taskPayload.put("assignmentsPending", taskSummary.getAssignmentsPending());
        }
        items.add(RoleWidgetItem.builder()
                .key("admin.pendingTasks")
                .title("Operational Tasks")
                .description("Monitor staffing and booking gaps")
                .payload(taskPayload)
                .build());

        return items;
    }

    private List<RoleWidgetItem> buildSuperAdminWidgets() {
        SuperAdminMetricsSummary metrics = profileWidgetMapper.findSuperAdminMetrics();
        if (metrics == null) {
            return Collections.emptyList();
        }
        List<RoleWidgetItem> items = new ArrayList<>();
        Map<String, Object> approvalsPayload = new LinkedHashMap<>();
        approvalsPayload.put("pendingAdminApprovals", metrics.getPendingAdminApprovals());
        items.add(RoleWidgetItem.builder()
                .key("superadmin.pendingApprovals")
                .title("Pending Admin Approvals")
                .description(metrics.getPendingAdminApprovals() != null && metrics.getPendingAdminApprovals() > 0
                        ? "Approve course admin requests" : "No pending approvals")
                .payload(approvalsPayload)
                .build());

        Map<String, Object> systemPayload = new LinkedHashMap<>();
        systemPayload.put("activeCourses", metrics.getActiveCourses());
        systemPayload.put("newUsers7d", metrics.getNewUsers7d());
        systemPayload.put("totalUsers", metrics.getTotalUsers());
        items.add(RoleWidgetItem.builder()
                .key("superadmin.systemMetrics")
                .title("System Snapshot")
                .description("High-level platform metrics")
                .payload(systemPayload)
                .build());
        return items;
    }

    private RoleWidgetItem createSessionItem(String key, String title, SessionSummaryDto summary, String description) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (summary != null) {
            payload.put("sessionId", summary.getSessionId());
            payload.put("assignmentId", summary.getAssignmentId());
            payload.put("assignmentName", summary.getAssignmentName());
            payload.put("startAt", summary.getStartAt());
            payload.put("endAt", summary.getEndAt());
            payload.put("venue", summary.getVenueName());
        }
        String desc = summary != null && summary.getStartAt() != null
                ? String.format("%s • %s", summary.getAssignmentName(), summary.getStartAt().format(TIME_FORMATTER))
                : description;
        return RoleWidgetItem.builder()
                .key(key)
                .title(title)
                .description(desc)
                .payload(payload)
                .build();
    }

    private RoleWidgetItem createSessionListItem(String key, String title, List<SessionSummaryDto> sessions, String description) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (SessionSummaryDto summary : sessions) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sessionId", summary.getSessionId());
            row.put("assignmentId", summary.getAssignmentId());
            row.put("assignmentName", summary.getAssignmentName());
            row.put("startAt", summary.getStartAt());
            row.put("endAt", summary.getEndAt());
            row.put("venue", summary.getVenueName());
            if (summary.getStartAt() != null) {
                row.put("label", summary.getStartAt().format(TIME_FORMATTER));
            }
            data.add(row);
        }
        Map<String, Object> payload = Collections.singletonMap("sessions", data);
        return RoleWidgetItem.builder()
                .key(key)
                .title(title)
                .description(description)
                .payload(payload)
                .build();
    }
}
