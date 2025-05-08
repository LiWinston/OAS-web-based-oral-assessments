# User Story Modifications and Additions Summary

Based on the client meeting feedback and further clarifications, the following user stories have been modified or added to better align with project requirements.

## New Epic

### Epic 9: Super Admin Management

Added a new epic to address the two-tier administration structure with the following user stories:

1. **9.1 Super Admin Authentication** - Secure login for Super Admins
2. **9.2 Course Admin Account Creation** - Manually creating Course Admin accounts based on email requests
3. **9.3 System-Wide Course Visibility** - Read-only view of all courses across the system
4. **9.4 Admin Access Control** - Granting/revoking system access for Course Admins
5. **9.5 Admin User Management** - Managing a list of all Course Admins in the system

## Modified User Stories

### Data Import and Export

1. **1.1 CSV Upload (Modified)**
   - **Original:** "As an administrator, I want to upload a CSV file containing students and group information so that I can import data automatically and easily"
   - **Modified:** "As an administrator, I want to upload a CSV file containing students and group information at the assignment level so that I can import and update data relevant to specific assignments automatically and easily"
   - **Reason:** Client specified CSV uploads should be at the assignment level, not course level.

### Assessment and Feedback

2. **3.7 Progress and Notes (Modified)**

   - **Original:** "As an examiner, I want to be able to save my progress while marking and submit the final marks/feedback for each student/group so that the data is captured by the system"
   - **Modified:** "As an examiner, I want to be able to save my progress, add notes visible to administrators, and submit the final marks/feedback for each student/group so that the assessment data and any special circumstances are properly captured"
   - **Reason:** Client requested notes be visible to administrators for tracking issues or exceptions.

3. **3.10 Comment Library Contributions (NEW)**
   - **New:** "As an examiner, I want to add new comments to the criterion-specific comment libraries during marking so that useful feedback phrases become available to other examiners for that specific criterion, while understanding that only course coordinators can edit or remove comments"
   - **Size:** Medium
   - **Priority:** Should Have
   - **Justification:** Enables collaborative improvement of the feedback process
   - **Reason:** Client requested examiners be able to add comments to specific criterion libraries.

### Assessment Structure Configuration

4. **4.2 Assignment Types (Modified)**

   - **Original:** "As an administrator, I want to create specific assignments linked to subjects, designating them as individual or group based so that the booking and marking process aligns with the assignment type"
   - **Modified:** "As an administrator, I want to create specific assignments linked to subjects, designating them as individual, group, or mixed (containing both individual and group components) so that the booking and marking process aligns with the assignment type"
   - **Reason:** Client clarified that assignments can be mixed type.

5. **4.5 Rubric Performance Levels (Modified)**

   - **Original:** "As an administrator, I want to define various marking options for each criterion so that rubrics support diverse grading approaches"
   - **Modified:** "As an administrator, I want to define customizable performance levels for each criterion (including number of levels, level names, and manual mark values per level) so that rubrics support diverse and precise grading approaches"
   - **Reason:** Client requested much higher flexibility in rubric configuration.

6. **4.6 Criterion-Specific Comments (Modified)**
   - **Original:** "As an administrator, I want to create pre-defined comments for examiners to select from so that examiners can provide consistent and efficient feedback"
   - **Modified:** "As an administrator, I want to create and manage criterion-specific comment libraries so that examiners have access to relevant, consistent feedback options for each distinct assessment criterion"
   - **Reason:** Client specified comment libraries should be criterion-specific with only coordinators able to edit/remove.

### Booking and Scheduling

7. **5.1 Replaced with three distinct stories:**

   **5.1.1 Session Parameters (NEW)**

   - "As an administrator, I want to define oral assessment session parameters (session length, gap time between sessions, required examiners per session) so that I can establish the basic structure for all assessment periods"
   - **Size:** Medium
   - **Priority:** Must Have
   - **Justification:** Establishes foundational parameters for assessment scheduling

   **5.1.2 Assessment Periods (NEW)**

   - "As an administrator, I want to create assessment periods by specifying start date/time, number of sessions, venue, and viewing the calculated end time so that I can efficiently schedule multiple assessment sessions"
   - **Size:** Medium
   - **Priority:** Must Have
   - **Justification:** Streamlines the process of scheduling multiple related assessment sessions

   **5.1.3 Period Duplication (NEW)**

   - "As an administrator, I want to duplicate existing assessment periods with the ability to modify details (date, time, venue) so that I can quickly create similar scheduling blocks without repetitive data entry"
   - **Size:** Small
   - **Priority:** Should Have
   - **Justification:** Improves efficiency of the scheduling process

   **Reason:** Original story replaced to better capture the detailed workflow for session setup.

8. **5.9 Examiner Self-Assignment (Modified)**

   - **Original:** "As an examiner, I want to assign myself to available time slots for assessments I am responsible for so that I can build my examination schedule"
   - **Modified:** "As an examiner, I want to view and self-assign to specific time slots (showing date, time, venue, required examiners, and session count) within minimum and maximum allocation limits set by the administrator so that I can build a fair and balanced examination schedule"
   - **Reason:** Client changed examiner assignment model to include detailed slot information and allocation limits.

9. **5.10 Examiner Allocation Limits (NEW)**
   - "As an administrator, I want to set minimum and maximum allocation limits for examiners per assignment so that workload is distributed fairly among the examination team"
   - **Size:** Small
   - **Priority:** Must Have
   - **Justification:** Ensures equitable distribution of assessment responsibilities
   - **Reason:** Addresses requirement for admins to control examiner workload balance.

### Mark Management and Publication

10. **6.7 Administrator Reports (Modified)**
    - **Original:** "As an administrator, I want access to a reporting dashboard for generating reports on assessment completion, mark distributions, and other metrics so that I can analyze assessment outcomes and processes"
    - **Modified:** "As an administrator, I want access to specialized reports including scheduling overview (slots, venues, examiners, validity, bookings), mark results (examiner-specific marks, aggregation options, comments), and examiner marking trends (real-time averages) so that I can comprehensively monitor and analyze the assessment process"
    - **Reason:** Client requested specific reporting capabilities, including real-time examiner marking trends.

## Summary of New User Stories

1. **Epic 9: Super Admin Management** - 5 new user stories (9.1 through 9.5)
2. **3.10 Comment Library Contributions** - For examiners to add to criterion-specific libraries
3. **5.1.1 Session Parameters** - For defining base assessment session structure
4. **5.1.2 Assessment Periods** - For creating blocks of assessment sessions
5. **5.1.3 Period Duplication** - For efficient creation of similar assessment periods
6. **5.10 Examiner Allocation Limits** - For setting min/max assessment sessions per examiner

Total of 11 new user stories, with 8 existing stories modified to better align with client requirements.
