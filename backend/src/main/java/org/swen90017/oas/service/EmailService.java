package org.swen90017.oas.service;

import org.swen90017.oas.entity.SysStudent;

import java.util.List;

public interface EmailService {
    void sendActivationEmail(List<SysStudent> sysStudent);
}
