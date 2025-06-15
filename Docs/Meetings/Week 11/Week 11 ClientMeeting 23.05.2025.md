# **Meeting Minutes: Project OAS - Week 11 Client Meeting**

Date: May 23, 2025  
Time: 1:43 AM - 3:00 AM (GMT)  
Attendees:

- **Client:** Hasti Samadi
- **Supervisor:** Geela Chee
- **Team:** Ian CHI, Haocheng Li (Casper)

## **1. Agenda**

- Prototype Demonstration (Updated Admin, Examiner, and Student Flows)
- Review of Implemented Changes from Mid-Term Feedback
- Assessment Configuration and Marking System Walkthrough
- Booking and Scheduling System Demonstration
- Client Feedback and Refinement Requirements
- Project Timeline and Next Steps Discussion

## **2. Prototype Demonstration & Key Features**

The team demonstrated the updated prototype incorporating the major pivots and feedback from the mid-term meeting. The demonstration covered all three main user flows with significant improvements and new functionality.

**2.1. Super Administrator Features**

The team presented the implemented two-tier admin structure as requested:

- **Course Management:** Super Admin can view and manage all courses created in the system, displaying course information including year, semester, and basic details. Search functionality has been added for easier course management.
- **Admin Management:** Super Admin can add new Course Admins by entering their email addresses and sending invitation emails for account creation and onboarding.

**2.2. Course Admin Onboarding Process**

A comprehensive onboarding workflow has been implemented:

- **Email Invitation System:** When Super Admin adds a new Course Admin, an invitation email is sent with an activation link.
- **Account Setup Process:** New admins complete account activation by confirming their email, entering their full name, selecting or creating their department, and assigning or creating courses.
- **Security:** The email address cannot be modified during onboarding as it is tied to the invitation sent by the Super Admin.

**2.3. Assessment Configuration and Marking System (Major Updates)**

Significant improvements were made to address the client's rubric customization requirements:

- **CSV Data Management:** Student and group data CSV upload has been successfully moved to the assignment level as requested, allowing Course Admins to import participant data before creating assignments.
- **Customizable Rubric Builder:**
  - Criterion creation with fully customizable names, descriptions, marking scales, and total points.
  - Performance levels with configurable names and flexible point ranges per criterion.
  - Complete flexibility in defining the number of performance levels per criterion.
- **Predefined Comments Management:**
  - Comments are now managed per criterion and organized by performance level as requested.
  - Course Admins can create and manage predefined comments for each performance level within each criterion.
  - Comments are displayed to examiners during marking for easy selection and use.

**2.4. Examiner Marking Interface Enhancements**

The marking system now supports the complex requirements identified:

- **Comment Integration:** Examiners can view predefined comments specific to each criterion and performance level during marking.
- **Comment Library Contribution:** Examiners can add new comments to the shared library, which become available for other examiners marking the same assignment.
- **Administrative Oversight:** Course Admins have the ability to edit and manage comments in the comment bank, while examiners can only add new comments (not modify existing ones) to prevent concurrency issues.

**2.5. Scheduling and Booking System (Complete Overhaul)**

The team implemented the complex scheduling requirements as specified:

- **Session Configuration:** Course Admins define session parameters including duration, gap time between sessions, and required number of examiners per session.
- **Time Slot Management:**
  - Admins create specific time slots with defined start times, venues, and number of consecutive sessions.
  - Automatic calculation of end times based on session count, duration, and gap times.
  - Support for multiple parallel time slots at different venues.
  - Duplicate and edit functionality for efficient time slot creation.
- **Examiner Assignment:** Real-time display of examiner allocation status for each time slot, showing completion status and assigned examiners.

## **3. Client Feedback and Refinement Requirements**

Several important clarifications and refinement requests emerged from the demonstration:

**3.1. Student Booking Interface**

- **Examiner Visibility:** Students should not be able to see examiner names when booking sessions to prevent preference-based selection and potential conflicts.
- **Session Release Policy:** Time slots should be available for student booking even if not fully staffed with examiners, allowing for concurrent examiner assignment and student registration.(Even though there still good to have a realease features, it should be flexible here)

**3.2. Time Slot Management Refinements**

- **Assigned Examiner Display:** The time slot management interface should only show examiners who have actually assigned themselves to that slot, not all available examiners in the system.
- **Add/Remove Functionality:** Course Admins should be able to add additional examiners to time slots through a separate "Add" button interface, might be a drop down list showing the available examiners
- **Booking Restrictions:** Once students have registered for a time slot, the time cannot be modified, though venue changes may still be permitted.

**3.3. Examiner Interface Improvements**

- **Credit System Removal:** The "credit" terminology and progress bars should be removed from the examiner interface to avoid confusion, as session limits may vary by individual contracts.
- **Hidden Limits:** Maximum session limits per examiner should be enforced through error messages when exceeded, but not displayed as visible progress indicators.
- **Limit Scope:** Session limits are set per assignment, not globally, to accommodate varying workload requirements.

**3.4. Results and Reporting**

- **Priority Clarification:** The student results viewing page was confirmed as lower priority, as most result release will continue through Canvas.
- **Comment Export Challenges:** Canvas does not provide easy import/export functionality for comments, making the internal comment viewing system potentially valuable for future use.
- **Alternative Use Case:** The internal results system may be useful for releasing detailed examiner comments to students when Canvas export is not feasible.

## **4. Student and Examiner Flow Demonstrations**

**4.1. Student Booking Experience**

The team demonstrated the complete student booking workflow:

- **Group Information:** Students can view their assigned group members for group assessments.
- **Session Selection:** Calendar interface showing available dates and time slots with venue information.
- **Booking Confirmation:** Clear confirmation process with booking summary and print functionality.
- **Reschedule Capability:** Students can modify bookings subject to administrative time restrictions.

**4.2. Examiner Assignment and Marking**

- **Time Slot Assignment:** Examiners view detailed time slot information including date, time, venue, and session requirements, then self-assign to desired slots.
- **Assignment Limits:** System enforces maximum session limits with error messages when exceeded.
- **Marking Interface:** Supports both group and individual assessment components with criterion-based marking and comment integration.

## **5. Technical and Project Management Discussion**

**5.1. AI Usage in Development**

The team requested clarification on generative AI use:

- **Academic Report:** Permission granted to use the project as a case study for required AI interaction reports.
- **Development Guidelines:** Client approved AI assistance for coding and documentation with important caveats about security review and human oversight.
- **Security Requirements:** Team must ensure all AI-generated code is thoroughly reviewed for security vulnerabilities and integration issues.
- **Data Protection:** No confidential student or assessment data should be included in any AI prompts.

**5.2. Project Timeline and Semester Transition**

Important timeline clarifications were established:

- **Current Semester Completion:** Team will finalize prototype improvements and documentation by mid-June cutoff.
- **Semester Break:** No work expected during the break period (mid-June to end of July) to allow for proper marking and evaluation.
- **Semester 2 Resumption:** Development will continue in Semester 2 starting end of July with the same team members.
- **Testing Limitations:** Real-world testing during Semester 2 may be limited due to potential conflicts of interest, though small-scale internal testing will be possible.

## **6. Action Items**

**For the Development Team:**

1. **Student Interface Refinements:**

   - Remove examiner name visibility from the student booking interface.
   - Ensure session booking works independently of complete examiner staffing.

2. **Time Slot Management Improvements:**

   - Modify time slot editing interface to show only assigned examiners by default.
   - Implement "Add Examiner" functionality with dropdown selection from available examiners.
   - Implement booking restrictions that prevent time changes once students are registered.

3. **Examiner Interface Updates:**

   - Remove all "credit" terminology and progress bar displays from examiner views.
   - Maintain session limit enforcement through error messages only.
   - Ensure session limits are configurable per assignment by Course Admins.

4. **Comment System Finalization:**

   - Complete the predefined comment management system for Course Admins.

5. **Documentation and Handover Preparation:**
   - Update all user stories and acceptance criteria to reflect final requirements.
   - Prepare comprehensive documentation for Semester 2 continuation.
   - Finalize prototype based on all feedback for end-of-semester presentation.

**For the Client:**

1. **Testing Coordination:** Explore possibilities for limited testing scenarios that avoid conflict of interest issues.
2. **Requirements Validation:** Review and confirm all implemented features meet expectations before Semester 2 development begins.

## **7. Next Steps**

- The team will implement the final refinements identified in this meeting and prepare comprehensive documentation for the semester conclusion.
- All major features have been validated and the core architecture is confirmed as meeting client requirements.
- Development will resume in Semester 2 with focus on full implementation, testing, and deployment preparation.
- A coordination meeting will be scheduled for early Semester 2 to plan the development timeline and any additional requirements that may emerge.
