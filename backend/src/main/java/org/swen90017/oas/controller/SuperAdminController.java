package org.swen90017.oas.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {
    @GetMapping("admins")
    public String getAdmins() {
        // This is a placeholder method. In a real application, you would return a list of admins.
        return "List of super admins";
    }

    @GetMapping("admins/{id}")
    public String getAdminById(String id) {
        // This is a placeholder method. In a real application, you would return the details of the admin with the given ID.
        return "Details of super admin with ID: " + id;
    }

    @PatchMapping("admins/{id}/status")
    public String updateAdminStatus(String id, String status) {
        // This is a placeholder method. In a real application, you would update the status of the admin with the given ID.
        return "Updated status of super admin with ID: " + id + " to " + status;
    }

    @DeleteMapping("admins/{id}")
    public String deleteAdmin(String id) {
        // This is a placeholder method. In a real application, you would delete the admin with the given ID.
        return "Deleted super admin with ID: " + id;
    }

    @GetMapping("admins/status")
    public String getAdminStatus() {
        // This is a placeholder method. In a real application, you would return the status of all admins.
        return "Status of all super admins";
    }

    @GetMapping("admins/check-email/{email}")
    public String checkAdminEmailExists(@PathVariable String email) {
        // This is a placeholder method. In a real application, you would check if the email exists for any admin.
        return "Check if super admin with email: " + email + " exists";
    }

    @GetMapping("courses")
    public String getCourses() {
        // This is a placeholder method. In a real application, you would return a list of courses.
        return "List of courses";
    }

    @GetMapping("courses/{id}")
    public String getCourseById(@PathVariable String id) {
        // This is a placeholder method. In a real application, you would return the details of the course with the given ID.
        return "Details of course with ID: " + id;
    }

}
