package org.swen90017.oas.schedule;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.swen90017.oas.entity.EmailNotification;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.mapper.EmailNotificationMapper;
import org.swen90017.oas.mapper.SysUserMapper;
import org.swen90017.oas.service.EmailService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatcher {

    private final EmailNotificationMapper emailNotificationMapper;
    private final SysUserMapper sysUserMapper;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelayString = "${notifications.dispatcher.fixedDelay:10000}")
    public void dispatch() {
        try {
            // fetch small batch
            QueryWrapper<EmailNotification> qw = new QueryWrapper<>();
            qw.eq("status", "PENDING");
            qw.and(w -> w.isNull("scheduled_at").or().le("scheduled_at", LocalDateTime.now()));
            qw.last("LIMIT 100");
            List<EmailNotification> batch = emailNotificationMapper.selectList(qw);
            if (batch == null || batch.isEmpty()) return;

            for (EmailNotification n : new ArrayList<>(batch)) {
                // claim
                int claimed = emailNotificationMapper.claim(n.getId(), "PENDING", "PROCESSING");
                if (claimed == 0) continue; // already taken by other dispatcher
                processOne(n);
            }
        } catch (Exception e) {
            log.error("Notification dispatch loop error: {}", e.getMessage(), e);
        }
    }

    private void processOne(EmailNotification n) {
        try {
            JsonNode payload = objectMapper.readTree(n.getPayloadJson());
            String type = n.getType();
            String courseName = text(payload, "courseName");
            String assignmentName = text(payload, "assignmentName");
            String message = text(payload, "message");

            SysUser user = null;
            if (n.getToUserId() != null) {
                user = sysUserMapper.selectById(n.getToUserId());
            }

            if (user == null) {
                user = new SysUser();
                user.setEmail(n.getToEmail());
            }

            if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                // mark failed gracefully
                n.setAttempts(n.getAttempts() == null ? 1 : n.getAttempts() + 1);
                n.setLastError("Missing recipient email");
                n.setStatus(n.getAttempts() >= 5 ? "FAILED" : "PENDING");
                n.setUpdatedAt(LocalDateTime.now());
                emailNotificationMapper.updateById(n);
                return;
            }

            if ("SCHEDULE_RELEASE_STUDENT".equals(type)) {
                emailService.sendScheduleReleaseEmailToStudent(user, courseName, assignmentName, message);
            } else if ("SCHEDULE_RELEASE_EXAMINER".equals(type)) {
                emailService.sendScheduleReleaseEmailToExaminer(user, courseName, assignmentName, message);
            } else {
                log.warn("Unknown notification type: {}", type);
            }

            // success
            n.setStatus("SENT");
            n.setSentAt(LocalDateTime.now());
            n.setAttempts(n.getAttempts() == null ? 1 : n.getAttempts() + 1);
            emailNotificationMapper.updateById(n);
        } catch (Exception e) {
            // retry policy: up to 5 attempts
            String msg = e.getMessage();
            n.setAttempts(n.getAttempts() == null ? 1 : n.getAttempts() + 1);
            n.setLastError(msg);
            n.setStatus(n.getAttempts() >= 5 ? "FAILED" : "PENDING");
            n.setUpdatedAt(LocalDateTime.now());
            emailNotificationMapper.updateById(n);
            log.error("Failed to process notification {}: {}", n.getId(), msg, e);
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() ? null : v.asText();
    }
}
