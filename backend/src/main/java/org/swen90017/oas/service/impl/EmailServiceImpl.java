package org.swen90017.oas.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.service.EmailService;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysExaminer;
import org.swen90017.oas.mapper.SysUserMapper;

import javax.mail.internet.MimeMessage;
import java.util.ArrayList;
import java.util.List;
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private SysUserMapper sysUserMapper;

    public void sendActivationEmail(List<SysStudent> sysStudents, String reason) {
        int batchSize = 30;
        List<MimeMessage> batch = new ArrayList<>(batchSize);

        for (SysStudent s : sysStudents) {
            if (s.getSisUserId() == null || s.getToken() == null) {
                log.warn("Skip student with missing sisUserId or token: {}", s);
                continue;
            }

            try {
                String to = null;
                try {
                    SysUser user = sysUserMapper.selectById(s.getUserId());
                    if (user != null && user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                        to = user.getEmail();
                    }
                } catch (Exception ignored) {}
                if (to == null || to.trim().isEmpty()) {
                    to = s.getSisUserId() + "@student.unimelb.edu.au";
                }
                String activationLink = "https://frontend-oas1.anzupop.com/onboarding?token=" + s.getToken();
                String reasonText = (reason == null || reason.trim().isEmpty())
                        ? "You have been invited to join an assessment."
                        : reason.trim();

                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Account Activation");

                String plain = "Hi there, this is from OAS Team,\n\n"
                        + "Reason: " + reasonText + "\n"
                        + "Click the link to activate: " + activationLink + "\n";
                String html = buildStudentActivationHtml(activationLink, reasonText);
                helper.setText(plain, html);

                batch.add(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to build activation email for student {}: {}", s, e.getMessage());
            }

            if (batch.size() >= batchSize) {
                sendHtmlBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            sendHtmlBatch(batch);
        }
    }

    private String buildStudentActivationHtml(String activationLink, String reasonText) {
        // Minimal, inline-styled, mobile-friendly template with CTA and reason highlight
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html>")
          .append("<html lang=\"en\"><head><meta charset=\"utf-8\">")
          .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
          .append("<title>Activate your account</title>")
          .append("</head><body style=\"margin:0;padding:0;background:#f6f8fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#f6f8fb;\"><tr><td align=\"center\" style=\"padding:32px 16px;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.06);\">")
          .append("<tr><td style=\"padding:32px 32px 8px 32px;text-align:center;border-top-left-radius:12px;border-top-right-radius:12px;\">")
          .append("<div style=\"font-size:20px;letter-spacing:.4px;color:#3b82f6;font-weight:700;\">OAS</div>")
          .append("<div style=\"margin-top:8px;font-size:22px;color:#111827;font-weight:700;\">Activate your account</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:8px 32px 0 32px;\">")
          .append("<p style=\"margin:6px 0 10px 0;color:#374151;font-size:15px;line-height:1.6;\">Hi there, this is from OAS Team,</p>")
          .append("<div style=\"margin:12px 0;padding:10px 14px;background:#eff6ff;border:1px solid #dbeafe;color:#1e40af;border-radius:8px;font-size:14px;\">")
          .append("<strong style=\"display:block;margin-bottom:4px;\">Reason</strong>")
          .append("<span>" + escapeHtml(reasonText) + "</span>")
          .append("</div>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">You're invited to access your oral assessment portal. Click the button below to activate your account and complete onboarding.</p>")
          .append("<div style=\"text-align:center;margin:24px 0;\">")
          .append("<a href=\"" + activationLink + "\" style=\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Activate Account</a>")
          .append("</div>")
          .append("<p style=\"margin:0 0 12px 0;color:#6b7280;font-size:13px;\">If the button doesn't work, copy and paste this link into your browser:</p>")
          .append("<p style=\"margin:0 0 16px 0;word-break:break-all;\"><a href=\"" + activationLink + "\" style=\"color:#2563eb;\">" + activationLink + "</a></p>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;\">")
          .append("<p style=\"margin:0;color:#9ca3af;font-size:12px;\">This invitation was sent by the OAS system. If you weren't expecting this, you can ignore this email.</p>")
          .append("</td></tr>")
          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Override
    public void sendExaminerActivationEmail(List<SysExaminer> examiners) {
        sendExaminerActivationEmail(examiners, null);
    }

    @Override
    public void sendExaminerActivationEmail(List<SysExaminer> examiners, String reason) {
        int batchSize = 30;
        List<MimeMessage> batch = new ArrayList<>(batchSize);
        log.info("Preparing to send examiner activation emails: count={}",
                examiners == null ? 0 : examiners.size());

        for (SysExaminer ex : examiners) {
            if (ex.getUserId() == null || ex.getToken() == null) {
                log.warn("Skip examiner with missing userId or token: {}", ex);
                continue;
            }
            SysUser user = sysUserMapper.selectById(ex.getUserId());
            if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                log.warn("Skip examiner with missing email for userId={}, sisUserId={}", ex.getUserId(), ex.getSisUserId());
                continue;
            }
            try {
                String to = user.getEmail();
                String activationLink = "https://frontend-oas1.anzupop.com/onboarding?token=" + ex.getToken();
                String reasonText = (reason == null || reason.trim().isEmpty()) ? null : reason.trim();

                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Examiner Account Activation");

                String plain = "Hi there, this is from OAS Team,\n\n"
                        + (reasonText != null ? ("Reason: " + reasonText + "\n") : "")
                        + "Click the link to activate: " + activationLink + "\n";
                String html = buildExaminerActivationHtml(activationLink, reasonText);
                helper.setText(plain, html);

                batch.add(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to build activation email for examiner {}: {}", ex, e.getMessage());
            }

            if (batch.size() >= batchSize) {
                sendHtmlBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            sendHtmlBatch(batch);
        }
    }

    private String buildExaminerActivationHtml(String activationLink, String reasonText) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html>")
          .append("<html lang=\"en\"><head><meta charset=\"utf-8\">")
          .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
          .append("<title>Activate your examiner account</title>")
          .append("</head><body style=\"margin:0;padding:0;background:#f6f8fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#f6f8fb;\"><tr><td align=\"center\" style=\"padding:32px 16px;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.06);\">")
          .append("<tr><td style=\"padding:32px 32px 8px 32px;text-align:center;border-top-left-radius:12px;border-top-right-radius:12px;\">")
          .append("<div style=\"font-size:20px;letter-spacing:.4px;color:#3b82f6;font-weight:700;\">OAS</div>")
          .append("<div style=\"margin-top:8px;font-size:22px;color:#111827;font-weight:700;\">Activate your examiner account</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:8px 32px 0 32px;\">")
          .append("<p style=\"margin:6px 0 10px 0;color:#374151;font-size:15px;line-height:1.6;\">Hi there, this is from OAS Team,</p>");
        if (reasonText != null) {
            sb.append("<div style=\"margin:12px 0;padding:10px 14px;background:#eff6ff;border:1px solid #dbeafe;color:#1e40af;border-radius:8px;font-size:14px;\">")
              .append("<strong style=\"display:block;margin-bottom:4px;\">Reason</strong>")
              .append("<span>").append(escapeHtml(reasonText)).append("</span>")
              .append("</div>");
        }
        sb.append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">You're invited to access your examiner portal. Click the button below to activate your account and complete onboarding.</p>")
          .append("<div style=\"text-align:center;margin:24px 0;\">")
          .append("<a href=\"").append(activationLink).append("\" style=\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Activate Account</a>")
          .append("</div>")
          .append("<p style=\"margin:0 0 12px 0;color:#6b7280;font-size:13px;\">If the button doesn't work, copy and paste this link into your browser:</p>")
          .append("<p style=\"margin:0 0 16px 0;word-break:break-all;\"><a href=\"").append(activationLink).append("\" style=\"color:#2563eb;\">").append(activationLink).append("</a></p>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;\">")
          .append("<p style=\"margin:0;color:#9ca3af;font-size:12px;\">This invitation was sent by the OAS system. If you weren't expecting this, you can ignore this email.</p>")
          .append("</td></tr>")
          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
    }

    public void sendAdminActivationEmail(List<SysAdmin> admins) {
        int batchSize = 30;
        List<MimeMessage> batch = new ArrayList<>(batchSize);

        for (SysAdmin a : admins) {
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

            try {
                String activationLink = "https://frontend-oas1.anzupop.com/onboarding?token=" + a.getToken();
                MimeMessage mime = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Admin Invitation");
                String plain = "Hi there, this is from OAS Team,\n\n"
                        + "You're invited to access the OAS admin portal.\n"
                        + "Click the link to activate: " + activationLink + "\n";
                String html = buildAdminActivationHtml(activationLink);
                helper.setText(plain, html);
                batch.add(mime);
            } catch (Exception e) {
                log.error("Failed to build admin activation email: {}", e.getMessage());
            }

            if (batch.size() >= batchSize) {
                sendHtmlBatch(batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            sendHtmlBatch(batch);
        }
    }

    private String buildAdminActivationHtml(String activationLink) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!doctype html>")
          .append("<html lang=\"en\"><head><meta charset=\"utf-8\">")
          .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
          .append("<title>Admin invitation</title>")
          .append("</head><body style=\"margin:0;padding:0;background:#f6f8fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background:#f6f8fb;\"><tr><td align=\"center\" style=\"padding:32px 16px;\">")
          .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.06);\">")
          .append("<tr><td style=\"padding:32px 32px 8px 32px;text-align:center;border-top-left-radius:12px;border-top-right-radius:12px;\">")
          .append("<div style=\"font-size:20px;letter-spacing:.4px;color:#3b82f6;font-weight:700;\">OAS</div>")
          .append("<div style=\"margin-top:8px;font-size:22px;color:#111827;font-weight:700;\">You're invited to OAS Admin</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:8px 32px 0 32px;\">")
          .append("<p style=\"margin:6px 0 10px 0;color:#374151;font-size:15px;line-height:1.6;\">Hi there, this is from OAS Team,</p>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">You're invited to access the OAS admin portal. Click the button below to activate your account and complete onboarding.</p>")
          .append("<div style=\"text-align:center;margin:24px 0;\">")
          .append("<a href=\"" + activationLink + "\" style=\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Activate Account</a>")
          .append("</div>")
          .append("<p style=\"margin:0 0 12px 0;color:#6b7280;font-size:13px;\">If the button doesn't work, copy and paste this link into your browser:</p>")
          .append("<p style=\"margin:0 0 16px 0;word-break:break-all;\"><a href=\"" + activationLink + "\" style=\"color:#2563eb;\">" + activationLink + "</a></p>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;\">")
          .append("<p style=\"margin:0;color:#9ca3af;font-size:12px;\">This invitation was sent by the OAS system. If you weren't expecting this, you can ignore this email.</p>")
          .append("</td></tr>")
          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
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

    @Override
    public void sendCourseJoinNotification(List<SysUser> registeredStudents, String courseName, String assignmentName) {
        if (registeredStudents == null || registeredStudents.isEmpty()) {
            log.info("No registered students to notify for course join");
            return;
        }
        
        int batchSize = 30;
        List<MimeMessage> batch = new ArrayList<>(batchSize);
        log.info("Preparing to send course join notifications to {} registered students", registeredStudents.size());
        
        for (SysUser student : registeredStudents) {
            if (student.getEmail() == null || student.getEmail().trim().isEmpty()) {
                log.warn("Skip student with missing email: userId={}", student.getUserId());
                continue;
            }
            
            try {
                String to = student.getEmail();
                String loginLink = "https://frontend-oas1.anzupop.com/login";
                
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Course Assignment Notification");
                
                String plain = "Hi " + (student.getUserName() != null ? student.getUserName() : "there") + ",\n\n"
                        + "You have been added to a new course assignment:\n"
                        + "Course: " + (courseName != null ? courseName : "N/A") + "\n"
                        + "Assignment: " + (assignmentName != null ? assignmentName : "N/A") + "\n\n"
                        + "Please log in to view your assignment details: " + loginLink + "\n\n"
                        + "Best regards,\nOAS Team";
                
                String html = buildCourseJoinHtml(student.getUserName(), courseName, assignmentName, loginLink);
                helper.setText(plain, html);
                
                batch.add(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to build course join email for student {}: {}", student.getUserId(), e.getMessage());
            }
            
            if (batch.size() >= batchSize) {
                sendHtmlBatch(batch);
                batch.clear();
            }
        }
        
        if (!batch.isEmpty()) {
            sendHtmlBatch(batch);
        }
    }
    
    @Override
    public void sendExaminerCourseJoinNotification(List<SysUser> registeredExaminers, String courseName, String assignmentName) {
        if (registeredExaminers == null || registeredExaminers.isEmpty()) {
            log.info("No registered examiners to notify for course join");
            return;
        }
        
        int batchSize = 30;
        List<MimeMessage> batch = new ArrayList<>(batchSize);
        log.info("Preparing to send course join notifications to {} registered examiners", registeredExaminers.size());
        
        for (SysUser examiner : registeredExaminers) {
            if (examiner.getEmail() == null || examiner.getEmail().trim().isEmpty()) {
                log.warn("Skip examiner with missing email: userId={}", examiner.getUserId());
                continue;
            }
            
            try {
                String to = examiner.getEmail();
                String loginLink = "https://frontend-oas1.anzupop.com/login";
                
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setSubject("Examiner Assignment Notification");
                
                String plain = "Hi " + (examiner.getUserName() != null ? examiner.getUserName() : "there") + ",\n\n"
                        + "You have been assigned as an examiner for a new course assignment:\n"
                        + "Course: " + (courseName != null ? courseName : "N/A") + "\n"
                        + "Assignment: " + (assignmentName != null ? assignmentName : "N/A") + "\n\n"
                        + "Please log in to view your assignment details: " + loginLink + "\n\n"
                        + "Best regards,\nOAS Team";
                
                String html = buildExaminerCourseJoinHtml(examiner.getUserName(), courseName, assignmentName, loginLink);
                helper.setText(plain, html);
                
                batch.add(mimeMessage);
            } catch (Exception e) {
                log.error("Failed to build course join email for examiner {}: {}", examiner.getUserId(), e.getMessage());
            }
            
            if (batch.size() >= batchSize) {
                sendHtmlBatch(batch);
                batch.clear();
            }
        }
        
        if (!batch.isEmpty()) {
            sendHtmlBatch(batch);
        }
    }
    
    private String buildCourseJoinHtml(String userName, String courseName, String assignmentName, String loginLink) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Course Assignment Notification</title></head><body style=\"margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;\">")
          .append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f9fafb;padding:20px 0;\">")
          .append("<tr><td align=\"center\">")
          .append("<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);\">")
          .append("<tr><td style=\"padding:32px 32px 0 32px;text-align:center;\">")
          .append("<h1 style=\"margin:0 0 8px 0;color:#1f2937;font-size:28px;font-weight:700;\">Course Assignment</h1>")
          .append("<p style=\"margin:0;color:#6b7280;font-size:16px;\">You've been added to a new assignment</p>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:8px 32px 0 32px;\">")
          .append("<p style=\"margin:6px 0 10px 0;color:#374151;font-size:15px;line-height:1.6;\">Hi ").append(escapeHtml(userName != null ? userName : "there")).append(",</p>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">You have been added to a new course assignment:</p>")
          .append("<div style=\"background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;\">")
          .append("<p style=\"margin:0 0 8px 0;color:#374151;font-size:15px;\"><strong>Course:</strong> ").append(escapeHtml(courseName != null ? courseName : "N/A")).append("</p>")
          .append("<p style=\"margin:0;color:#374151;font-size:15px;\"><strong>Assignment:</strong> ").append(escapeHtml(assignmentName != null ? assignmentName : "N/A")).append("</p>")
          .append("</div>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">Please log in to view your assignment details and any upcoming booking opportunities.</p>")
          .append("<div style=\"text-align:center;margin:24px 0;\">")
          .append("<a href=\"" + loginLink + "\" style=\"display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Log In to OAS</a>")
          .append("</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;\">")
          .append("<p style=\"margin:0;color:#9ca3af;font-size:12px;\">This notification was sent by the OAS system. If you have any questions, please contact your course administrator.</p>")
          .append("</td></tr>")
          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
    }
    
    private String buildExaminerCourseJoinHtml(String examinerName, String courseName, String assignmentName, String loginLink) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Examiner Assignment Notification</title></head><body style=\"margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;\">")
          .append("<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#f9fafb;padding:20px 0;\">")
          .append("<tr><td align=\"center\">")
          .append("<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);\">")
          .append("<tr><td style=\"padding:32px 32px 0 32px;text-align:center;\">")
          .append("<h1 style=\"margin:0 0 8px 0;color:#1f2937;font-size:28px;font-weight:700;\">Examiner Assignment</h1>")
          .append("<p style=\"margin:0;color:#6b7280;font-size:16px;\">You've been assigned to a new examination</p>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:8px 32px 0 32px;\">")
          .append("<p style=\"margin:6px 0 10px 0;color:#374151;font-size:15px;line-height:1.6;\">Hi ").append(escapeHtml(examinerName != null ? examinerName : "there")).append(",</p>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">You have been assigned as an examiner for a new course assignment:</p>")
          .append("<div style=\"background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;\">")
          .append("<p style=\"margin:0 0 8px 0;color:#374151;font-size:15px;\"><strong>Course:</strong> ").append(escapeHtml(courseName != null ? courseName : "N/A")).append("</p>")
          .append("<p style=\"margin:0;color:#374151;font-size:15px;\"><strong>Assignment:</strong> ").append(escapeHtml(assignmentName != null ? assignmentName : "N/A")).append("</p>")
          .append("</div>")
          .append("<p style=\"margin:16px 0 0 0;color:#374151;font-size:15px;line-height:1.6;\">Please log in to view your examination schedule and assignment details.</p>")
          .append("<div style=\"text-align:center;margin:24px 0;\">")
          .append("<a href=\"" + loginLink + "\" style=\"display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;\">Log In to OAS</a>")
          .append("</div>")
          .append("</td></tr>")
          .append("<tr><td style=\"padding:16px 32px 28px 32px;border-top:1px solid #f3f4f6;\">")
          .append("<p style=\"margin:0;color:#9ca3af;font-size:12px;\">This notification was sent by the OAS system. If you have any questions, please contact the course administrator.</p>")
          .append("</td></tr>")
          .append("</table>")
          .append("</td></tr></table>")
          .append("</body></html>");
        return sb.toString();
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

    @Async
    protected void sendHtmlBatch(List<MimeMessage> batch) {
        try {
            mailSender.send(batch.toArray(new MimeMessage[0]));
            log.info("Successfully sent {} HTML activation emails.", batch.size());
        } catch (MailException e) {
            log.error("Failed to send a batch of {} HTML emails: {}", batch.size(), e.getMessage());
        }
    }
}
