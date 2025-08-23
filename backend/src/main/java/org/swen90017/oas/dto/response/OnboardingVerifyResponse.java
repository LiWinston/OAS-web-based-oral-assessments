package org.swen90017.oas.dto.response;

import lombok.Data;

import java.io.Serializable;

@Data
public class OnboardingVerifyResponse implements Serializable {
    private boolean success;
    /** valid | expired | invalid */
    private String status;
    private boolean alreadyRegistered;
    /** COURSE_ADMIN | STUDENT | EXAMINER */
    private String role;
    private String email;
    private String fullName;
    private String department; // for course admin

    // For student/examiner context
    private CourseContext courseContext;
    private AssignmentContext assignmentContext;

    @Data
    public static class CourseContext implements Serializable {
        private String courseId;
        private String courseName;
        private String courseCode;
        private String coordinatorName;
    }

    @Data
    public static class AssignmentContext implements Serializable {
        private String assignmentId;
        private String assignmentName;
    }

    // For error case
    private String message;
}


