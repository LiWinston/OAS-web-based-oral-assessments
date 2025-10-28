# Integration Test for Group Workflow

**Project Component:** Assessment and Grading System (Timeslot Assessments, Group Rubric, Examiner Assessments)
**Test Phase:** System Testing / User Acceptance Testing (UAT)
**Test Environment:** *(Assumed: Web Application Interface)*
**Document Version:** 1.0
**Date:** 2025-10-18

---

### I. Executive Summary

This report details defects and observations identified during the testing of the Assessment and Grading System's Timeslot Assessments and Group Rubric features. Several discrepancies were noted in data presentation, particularly concerning student counts, scoring, and display logic. These issues impact the accuracy of the grading interface and the administrative view of group assignments.

### II. Test Items

The following items/functionalities were tested and are the subject of the reported issues:
1.  **Timeslot Assessments UI** (Data presentation of Total Count, Students, Groups)
2.  **Assignment Student Management** (Admin/Student UI linkage, Student activation)
3.  **Booking/Calendar Functionality** (Group booking display)
4.  **Examiner Import Logic** (Field usage: Email vs. SIS Login ID)
5.  **Assessment Scoring Display** (Total score, Version functionality, Group Total points)
6.  **Group Rubric UI** (Comment placeholder display)
7.  **Assignment Progress View** (Student count and progress bar accuracy)

---

### III. Detailed Defect Log

| Defect ID  | Severity | Component              | Description                                                  | Steps to Reproduce / Details                                 |
| :--------- | :------- | :--------------------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| **DEF001** | High     | Timeslot Assessment    | **Mismatched Student Count in Timeslot Information.** The **"Students"** count displays `0`  when it should reflect the number of group members. The **"Total Count"** shows `1` and **"Groups"** shows `1` for a group with `2 member(s)`. This suggests a backend data transmission error. | Navigate to Timeslot Assessments screen. Observe "Students" count is `0` when `# Group ID: 31` has `2 member(s)`. |
| **DEF002** | Medium   | Scoring/Rubric Display | **Incorrect Score Display and Missing Version Functionality.** The displayed score is potentially incorrect, such as **"Your score 0%"** on a Revision submission, and the **version functionality is likely unimplemented**. | Review the assignment summary screen. Observe the score display and lack of version tracking for submissions. |
| **DEF003** | Low      | Scoring/Rubric Display | **Superfluous Group Total Points.** The **"Group total"** displayed as `173.00 pts` appears to be without clear significance and is suggested for removal. | View the Examiner Assessments Group Rubric summary. Observe the `Group total` points. |
| **DEF004** | Medium   | Group Rubric UI        | **Placeholder Text Displayed Without Comments.** On the Group Rubric view, the comment placeholder text ("Add your comment here") should be removed if no comment has been entered or if the user is viewing the score. | View the completed Group Rubric assessment results. Observe the comment section displays the placeholder even if no comment exists. |
| **DEF005** | High     | Assignment Progress    | **Inaccurate Student Count and Progress Bar.** The assignment view shows **"0 students"** and the **"Progress"** bar shows `33%` even though sessions have been configured. Both the student count and the progress percentage are incorrect. | View the main assignment page ("Weiran's Group Test"). Observe the student count and progress percentage. |
| **DEF006** | Medium   | Examiner Feedback      | **Incorrect Feedback Label.** The section labeled **"STUDENT FEEDBACK"** with the query **"What can i say"** should be labeled as **"Examiner Feedback". | View the Examiner Assessments section below the Group Rubric. Observe the feedback label. |
| **DEF007** | Medium   | Final Score            | **Admin Override Failure.** After an Admin overrides the final score, the student still sees the score given by the Examiner. | Admin attempts to override the final score. Student views their result and sees the original Examiner score. |

---

### IV. Observations / Low Priority Issues

| ID         | Component        | Description                                                  | Impact                |
| :--------- | :--------------- | :----------------------------------------------------------- | :-------------------- |
| **OBS001** | Admin Student UI | The Admin Student interface returns the ID from the `sys_group` table, which may be illogical, but is functional. | Low (Functional)      |
| **OBS002** | Student Account  | Student activation/password assignment was not tested; passwords were force-assigned by copying an encrypted password and setting `status` to `0`. | N/A (Test Limitation) |
| **OBS003** | Booking/Calendar | After a student completes a group booking, the calendar entry still displays it as an individual booking. | Low (Minor UI issue)  |
| **OBS004** | Examiner Import  | During examiner import, **`email` was not utilized**; only **`SIS Login ID`** was used. It is suggested that a **frontend annotation/comment** be added to clarify which fields are used. | Low (Clarity/UX)      |

---

### V. Conclusion

The defects logged, particularly **DEF001** (Mismatched Student Count) and **DEF005** (Inaccurate Progress/Student Count), represent data integrity issues that require immediate **Root Cause Analysis** and resolution. The remaining defects are primarily **User Interface/User Experience (UI/UX)** issues and lower-priority functional discrepancies. A **Regression Testing** phase will be required upon deployment of the fixes to ensure existing functionality remains intact.