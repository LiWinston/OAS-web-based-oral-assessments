package org.swen90017.oas.service;

import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysAdmin;

import java.util.List;

public interface EmailService {
    void sendActivationEmail(List<SysStudent> sysStudent);

    /**
     * Send activation emails to course administrators.
     */
    void sendAdminActivationEmail(List<SysAdmin> admins);

    void sendAdminActivationEmail(SysAdmin admins);

}
