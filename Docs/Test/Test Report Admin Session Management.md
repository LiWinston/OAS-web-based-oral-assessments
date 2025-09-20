# Test Report: Admin Session Management

## 1.0 Introduction

**Date:** 2025-09-16

**Tester**: Weiran & Benyuan

**Objective:** This document outlines the identified bugs and usability issues within the admin interface for managing examiner sessions. The findings are based on a review of the current system's behaviour as detailed in the "Admin Session.md" document.

## 2.0 Test Summary

This report details three critical issues identified in the admin session management functionality. These issues significantly impact the user experience and data integrity of the system. The key findings include a front-end discrepancy when assigning examiners beyond the session limit, a lack of error feedback for invalid operations, and a static, non-functional display of examiner session counts. Addressing these issues is crucial for ensuring system reliability and usability.

## 3.0 Detailed Findings

### 3.1 Defect ID: ADM-001 - Examiner Assignment Exceeds Limit on Front-End

- **Status:** New
- **Severity:** High
- **Priority:** High
- **Component:** Session Management

**Defect Description:** When an administrator assigns an examiner to a session that has already reached its maximum examiner capacity, the front-end interface incorrectly suggests that the assignment was successful. However, the back-end correctly prevents the assignment, leading to a data inconsistency between the user interface and the database.

**Steps to Reproduce:**

1. Navigate to the session management page.
2. Select a session that has already reached its maximum number of assigned examiners.
3. Attempt to assign a new examiner to this session.
4. Observe that the front-end allows the assignment action without any immediate error.
5. Refresh the page or check the database to confirm that the new examiner was not actually assigned.

**Expected Result:** The front-end should prevent the administrator from assigning an examiner to a session that is already full. An error message, such as "Session examiner limit reached," should be displayed to the user.

**Actual Result:** The front-end allows the assignment to proceed, but the change is not saved in the back-end. No error message is displayed to the user.

**Recommendations:** Implement front-end validation to check the session's examiner count before allowing a new assignment. Disable the "assign" button or display an immediate error message if the session is full.

### 3.2 Defect ID: ADM-002 - Lack of Error Notifications for Invalid Operations

- **Status:** New
- **Severity:** Medium
- **Priority:** High
- **Component:** Session Management

**Defect Description:** The system does not provide any error feedback to the user when an invalid operation is performed. For example, if an admin attempts to create a duplicate session (with the same time and location as an existing one), the system correctly prevents the creation, but it does not inform the user why the action failed.

**Steps to Reproduce:**

1. Navigate to the session creation page.
2. Attempt to create a new session with a time and location that conflicts with an existing session.
3. Submit the form to create the session.
4. Observe that the session is not created.

**Expected Result:** The system should display a clear and informative error message, such as "A session with this time and location already exists," and the duplicate session should not be created.

**Actual Result:** The invalid session is not created, but the system fails to display any error pop-up or notification to inform the user of the issue.

**Recommendations:** Implement a global error handling system that displays clear and user-friendly error messages for all failed operations. This will improve usability by providing immediate feedback to the user.

### 3.3 Defect ID: ADM-003 - Examiner's Assigned Session Count is a Static Value

- **Status:** New
- **Severity:** High
- **Priority:** Medium
- **Component:** Examiner Management

**Defect Description:** On the examiner management page, the number displayed for "assigned sessions" for each examiner appears to be a static value and does not update when an examiner is assigned to or unassigned from a session. Furthermore, the corresponding back-end API endpoint for this data could not be located.

**Steps to Reproduce:**

1. Navigate to the examiner management page and note the "assigned sessions" count for a specific examiner.
2. Go to the session management page and assign a new session to that examiner.
3. Return to the examiner management page.
4. Observe that the "assigned sessions" count for the examiner has not changed.

**Expected Result:** The "assigned sessions" count for an examiner should dynamically update to reflect the actual number of sessions they are assigned to.

**Actual Result:** The "assigned sessions" count remains unchanged regardless of the actual number of sessions assigned to the examiner.

**Recommendations:**

1. Investigate and identify or create the necessary back-end API endpoint to fetch the real-time count of assigned sessions for each examiner.
2. Connect the front-end display to this API to ensure the data is dynamic and accurate.