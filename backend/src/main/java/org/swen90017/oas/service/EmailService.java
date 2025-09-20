package org.swen90017.oas.service;

import org.swen90017.oas.entity.SysStudent;
import org.swen90017.oas.entity.SysAdmin;
import org.swen90017.oas.entity.SysUser;
import org.swen90017.oas.entity.SysExaminer;

import java.util.List;

public interface EmailService {
    void sendActivationEmail(List<SysStudent> sysStudent, String reason);

    void sendExaminerActivationEmail(List<SysExaminer> examiners);

    void sendExaminerActivationEmail(List<SysExaminer> examiners, String reason);

    /**
     * Send activation emails to course administrators.
     */
    void sendAdminActivationEmail(List<SysAdmin> admins);

    void sendAdminActivationEmail(SysAdmin admins);

    /**
     * Send a password reset verification code to the user.
     * Always ensure no sensitive data is logged.
     *
     * @param user target user
     * @param code numeric/alphanumeric code
     * @param ttlMinutes time to live in minutes for display
     */
    void sendPasswordResetCode(SysUser user, String code, int ttlMinutes);

    /**
     * Send course join notification to registered students
     */
    void sendCourseJoinNotification(List<SysUser> registeredStudents, String courseName, String assignmentName);

    /**
     * Send course join notification to registered examiners
     */
    void sendExaminerCourseJoinNotification(List<SysUser> registeredExaminers, String courseName, String assignmentName);

}
