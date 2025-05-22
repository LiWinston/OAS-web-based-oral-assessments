package org.swen90017.oas.service.impl;

import org.springframework.stereotype.Service;
import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.service.EmailService;

import java.util.List;
@Service
public class EmailServiceImpl implements EmailService {
    @Override
    public void sendActivationEmail(List<SysStudent> sysStudent) {
        for (SysStudent s : sysStudent) {
            // Here you would implement the logic to send an email
            // For example, using JavaMailSender or any other email service
            System.out.println("Sending activation email to: " + s.getToken());
        }
    }
}
