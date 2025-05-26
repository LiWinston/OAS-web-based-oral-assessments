package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.service.EmailService;

import java.util.List;
@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendActivationEmail(List<SysStudent> sysStudents) {
        for (SysStudent s : sysStudents) {
            SimpleMailMessage message = new SimpleMailMessage();
            String emailAddress = s.getSisUserId()+"@student.unimelb.edu.au";
            message.setTo(emailAddress);
            message.setSubject("Account Activation");
            message.setText("Click the link to activate: https://example.com/activate?token=" + s.getToken());
            mailSender.send(message);
        }
    }
}
