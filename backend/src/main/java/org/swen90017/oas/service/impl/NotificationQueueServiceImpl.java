package org.swen90017.oas.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.AssignmentParticipant;
import org.swen90017.oas.entity.EmailNotification;
import org.swen90017.oas.entity.UserNotificationPreferences;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.AssignmentParticipantMapper;
import org.swen90017.oas.mapper.EmailNotificationMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.mapper.UserNotificationPreferencesMapper;
import org.swen90017.oas.service.NotificationQueueService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationQueueServiceImpl implements NotificationQueueService {

    private final AssignmentMapper assignmentMapper;
    private final SubjectMapper subjectMapper;
    private final AssignmentParticipantMapper assignmentParticipantMapper;
    private final SysUserMapper sysUserMapper;
    private final UserNotificationPreferencesMapper userNotificationPreferencesMapper;
    private final EmailNotificationMapper emailNotificationMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Long ROLE_STUDENT = 3L;
    private static final Long ROLE_EXAMINER = 2L;

    @Override
    public void enqueueScheduleReleaseToStudents(Long assignmentId, String message) {
        try {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment == null) {
                log.warn("enqueueScheduleReleaseToStudents: assignment {} not found", assignmentId);
                return;
            }
            Subject subject = subjectMapper.selectById(assignment.getSubjectId());
            String courseName = subject != null ? subject.getSubjectName() : null;
            String assignmentName = assignment.getName();

            // fetch joined student participants
            QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
            wrapper.eq("assignment_id", assignmentId)
                   .eq("role_id", ROLE_STUDENT)
                   .eq("if_join", 1);
            List<AssignmentParticipant> parts = assignmentParticipantMapper.selectList(wrapper);
            if (parts == null || parts.isEmpty()) {
                log.info("No joined students to notify for assignment {}", assignmentId);
                return;
            }
            List<Long> userIds = parts.stream().map(AssignmentParticipant::getUserId).collect(Collectors.toList());
            List<SysUser> users = userIds.isEmpty() ? Collections.emptyList() : sysUserMapper.selectBatchIds(userIds);
            Map<Long, SysUser> userMap = users.stream().filter(u -> u.getUserId() != null).collect(Collectors.toMap(SysUser::getUserId, u -> u));

            for (Long uid : userIds) {
                SysUser user = userMap.get(uid);
                if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                    continue; // skip invalid email
                }
                // preferences: default allow if record missing
                UserNotificationPreferences prefs = userNotificationPreferencesMapper.selectById(uid);
                boolean emailEnabled = prefs == null || prefs.getEmailEnabled() == null || Boolean.TRUE.equals(prefs.getEmailEnabled());
                boolean assignmentUpdates = prefs == null || prefs.getAssignmentUpdates() == null || Boolean.TRUE.equals(prefs.getAssignmentUpdates());
                if (!(emailEnabled && assignmentUpdates)) {
                    continue;
                }
                Map<String,Object> payload = new HashMap<>();
                payload.put("assignmentId", assignmentId);
                payload.put("courseName", courseName);
                payload.put("assignmentName", assignmentName);
                payload.put("message", message);

                EmailNotification n = new EmailNotification();
                n.setType("SCHEDULE_RELEASE_STUDENT");
                n.setToUserId(uid);
                n.setToEmail(user.getEmail());
                n.setPayloadJson(objectMapper.writeValueAsString(payload));
                n.setStatus("PENDING");
                n.setAttempts(0);
                n.setScheduledAt(LocalDateTime.now());
                n.setDedupKey("SCHED_REL:" + assignmentId + ":STU:" + uid);
                emailNotificationMapper.insert(n);
            }
        } catch (Exception e) {
            // isolation: swallow and log
            log.error("Failed to enqueue schedule notifications to students for assignment {}: {}", assignmentId, e.getMessage(), e);
        }
    }

    @Override
    public void enqueueScheduleReleaseToExaminers(Long assignmentId, String message) {
        try {
            Assignment assignment = assignmentMapper.selectById(assignmentId);
            if (assignment == null) {
                log.warn("enqueueScheduleReleaseToExaminers: assignment {} not found", assignmentId);
                return;
            }
            Subject subject = subjectMapper.selectById(assignment.getSubjectId());
            String courseName = subject != null ? subject.getSubjectName() : null;
            String assignmentName = assignment.getName();

            // fetch joined examiners
            QueryWrapper<AssignmentParticipant> wrapper = new QueryWrapper<>();
            wrapper.eq("assignment_id", assignmentId)
                   .eq("role_id", ROLE_EXAMINER)
                   .eq("if_join", 1);
            List<AssignmentParticipant> parts = assignmentParticipantMapper.selectList(wrapper);
            if (parts == null || parts.isEmpty()) {
                log.info("No joined examiners to notify for assignment {}", assignmentId);
                return;
            }
            List<Long> userIds = parts.stream().map(AssignmentParticipant::getUserId).collect(Collectors.toList());
            List<SysUser> users = userIds.isEmpty() ? Collections.emptyList() : sysUserMapper.selectBatchIds(userIds);
            Map<Long, SysUser> userMap = users.stream().filter(u -> u.getUserId() != null).collect(Collectors.toMap(SysUser::getUserId, u -> u));

            for (Long uid : userIds) {
                SysUser user = userMap.get(uid);
                if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                    continue; // skip invalid email
                }
                // preferences: default allow if record missing
                UserNotificationPreferences prefs = userNotificationPreferencesMapper.selectById(uid);
                boolean emailEnabled = prefs == null || prefs.getEmailEnabled() == null || Boolean.TRUE.equals(prefs.getEmailEnabled());
                boolean examinerUpdates = prefs == null || prefs.getExaminerUpdates() == null || Boolean.TRUE.equals(prefs.getExaminerUpdates());
                if (!(emailEnabled && examinerUpdates)) {
                    continue;
                }
                Map<String,Object> payload = new HashMap<>();
                payload.put("assignmentId", assignmentId);
                payload.put("courseName", courseName);
                payload.put("assignmentName", assignmentName);
                payload.put("message", message);

                EmailNotification n = new EmailNotification();
                n.setType("SCHEDULE_RELEASE_EXAMINER");
                n.setToUserId(uid);
                n.setToEmail(user.getEmail());
                n.setPayloadJson(objectMapper.writeValueAsString(payload));
                n.setStatus("PENDING");
                n.setAttempts(0);
                n.setScheduledAt(LocalDateTime.now());
                n.setDedupKey("SCHED_REL:" + assignmentId + ":EXM:" + uid);
                emailNotificationMapper.insert(n);
            }
        } catch (Exception e) {
            // isolation: swallow and log
            log.error("Failed to enqueue schedule notifications to examiners for assignment {}: {}", assignmentId, e.getMessage(), e);
        }
    }
}
