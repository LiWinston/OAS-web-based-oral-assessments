package org.swen90017.oas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.entity.SysUser;

import java.util.ArrayList;
import java.util.List;
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendActivationEmail(List<SysStudent> sysStudents) {
        int batchSize = 30;
        List<SimpleMailMessage> batch = new ArrayList<>(batchSize);

        for (SysStudent s : sysStudents) {
            if (s.getSisUserId() == null || s.getToken() == null) {
                log.warn("Skip student with missing sisUserId or token: {}", s);
                continue;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(s.getSisUserId() + "@student.unimelb.edu.au");
            message.setSubject("Account Activation");
            message.setText("Click the link to activate: https://example.com/activate?token=" + s.getToken());
            batch.add(message);

            if (batch.size() >= batchSize) {
                sendBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            sendBatch(batch);
        }
    }

    public void sendAdminActivationEmail(List<SysAdmin> admins) {
        int batchSize = 30;
        List<SimpleMailMessage> batch = new ArrayList<>(batchSize);

        for (SysAdmin a : admins) {
            // Prefer SIS Login ID if provided (admin CSV flow), fallback to email
            String to = null;
            if (a.getSisLoginId() != null && !a.getSisLoginId().isEmpty()) {
                to = a.getSisLoginId() + "@unimelb.edu.au";
            } else if (a.getEmail() != null && !a.getEmail().isEmpty()) {
                to = a.getEmail();
            }
            if (to == null) {
                log.warn("Skip admin due to missing email: {}", a);
                continue;
            }
            if (a.getToken() == null) {
                log.warn("Skip admin due to missing token: {}", a);
                continue;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Admin Invitation");
            message.setText("Click the link to activate: https://example.com/activate?token=" + a.getToken());
            batch.add(message);

            if (batch.size() >= batchSize) {
                sendBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            sendBatch(batch);
        }
    }

    @Override
    public void sendAdminActivationEmail(SysAdmin admin) {
        if (admin == null) return;
        List<SysAdmin> list = new ArrayList<>(1);
        list.add(admin);
        sendAdminActivationEmail(list);
    }

    @Override
    public void sendPasswordResetCode(SysUser user, String code, int ttlMinutes) {
        if (user == null || user.getEmail() == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Password Reset Code");
            message.setText("Your verification code is: " + code + "\nIt expires in " + ttlMinutes + " minutes.");
            mailSender.send(message);
            log.info("Sent password reset code email to {}", user.getEmail());
        } catch (MailException e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
        }
    }

    @Async
    protected void sendBatch(List<SimpleMailMessage> batch) {
        try {
            mailSender.send(batch.toArray(new SimpleMailMessage[0]));
            log.info("Successfully sent {} activation emails.", batch.size());
        } catch (MailException e) {
            log.error("Failed to send a batch of {} emails: {}", batch.size(), e.getMessage());
            // TODO: choose to record the failed users for a second try or notify the admin
        }
    }
}
