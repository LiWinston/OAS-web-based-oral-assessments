# Integration Test Report: CSV Upload and Update

## 1.0 Introduction

**Date:** 2025-10-09

**Project:** Assignment Module Integration

**Objective:** This report details critical issues discovered during the integration testing of the assignment creation and update workflows. The tests focused on the functionality related to creating 'Mixed' type assignments involving both student and group CSV uploads, the integrity of downloadable templates, and the user flow for updating existing assignments.

## 2.0 Executive Summary

This report documents three significant defects within the Assignment module that severely impact an administrator's ability to create and manage assignments. The findings highlight a critical failure in the creation of 'Mixed' type assignments, data integrity issues in the provided CSV templates, and a UI freeze during the assignment update process.

**Key findings are:**

1. **Workflow Blocker:** The creation of 'Mixed' type assignments fails when both student and group files are uploaded, causing the system to hang indefinitely in a "processing" state.
2. **Data Integrity Flaw:** The downloadable CSV template for groups contains confusing and erroneous example data, which is likely to cause user error during file preparation.
3. **UI Failure:** The "Update" button becomes unresponsive when an administrator attempts to upload a new CSV file to an existing assignment, making it impossible to complete the update.

These issues represent significant obstacles to the core administrative functions of the platform. It is recommended that these defects be addressed with high priority to ensure the system is usable for assignment setup and maintenance.

## 3.0 Detailed Findings

### 3.1 Defect ID: INT-001 - "Mixed" Type Assignment Creation Fails with Student and Group Upload

- **Status:** New
- **Severity:** Critical
- **Priority:** High
- **Component:** Assignment Creation Module

**Defect Description**:

When an administrator attempts to create an assignment of type "Mixed" and uploads both a student CSV file and a group CSV file as required, the system encounters a critical error. Although the front-end may appear to process the request, the back-end database status for the assignment becomes permanently stuck in "processing." The assignment is never successfully created or made available.

**Impact Analysis**:

This is a critical, workflow-blocking defect. It completely prevents the creation of "Mixed" type assignments, which is a core feature of the system designed to handle complex assessment structures. Administrators are unable to set up assignments that rely on both individual and group data.

**Steps to Reproduce:**

1. Navigate to the "Create Assignment" page.
2. Select the assignment type "Mixed".
3. Fill in all required assignment details.
4. In the file upload section, upload a valid student CSV file.
5. In the file upload section, upload a valid group CSV file.
6. Click the "Create" button to finalise the assignment.
7. Observe the system's response and check the assignment's status in the back-end database.

**Expected Result**:

The system should successfully process both CSV files, create the "Mixed" type assignment, and set its status to "active" or "created." The administrator should be able to view and manage the newly created assignment.

**Actual Result**:

An error occurs during processing. The back-end database shows the assignment's status is stuck in "processing," and the assignment creation process never completes.

**Recommendation:**

The back-end processing logic for 'Mixed' assignment creation needs to be debugged. Investigate how the system handles the ingestion and linking of data from the simultaneous upload of student and group CSVs. Review logs for any specific exceptions thrown during this process.

### 3.2 Defect ID: INT-002 - CSV Template for Groups Contains Erroneous Example Data

- **Status:** New
- **Severity:** Medium
- **Priority:** Medium
- **Component:** CSV Template Generation

**Defect Description:**

The downloadable CSV template provided for group uploads contains incorrect and confusing sample data. Specifically, multiple rows have the same group_name, but the final two columns (presumably related to student IDs or unique identifiers) are different. This presents a conflicting and illogical data structure.

**Impact Analysis:**

This issue will likely confuse administrators and lead to them creating improperly formatted CSV files for upload. This can result in data import failures, wasted time, and user frustration. It compromises the usability of the template, which is intended to simplify the process.

**Steps to Reproduce:**

1. Navigate to any feature that allows for a group CSV file upload (e.g., "Create Assignment").
2. Download the provided CSV template for groups.
3. Open the CSV file and inspect the sample rows.
4. Observe that the `group_name` column contains duplicate values while the values in the last two columns of those same rows are unique.

**Expected Result:**

The sample data in the CSV template should be logical, consistent, and serve as a clear and correct example for the user to follow. Each row should represent a valid and understandable data structure.

**Actual Result:**

The sample data is erroneous, showing the same group name associated with different IDs, which does not accurately represent the required data format.

**Recommendation:**

Correct the sample data within the downloadable group CSV template. Ensure the example rows are clear, logical, and accurately reflect the data structure the system expects.

### 3.3 Defect ID: INT-003 - Update Button Becomes Unresponsive After Uploading New CSV

- **Status:** New
- **Severity:** High
- **Priority:** High
- **Component:** Assignment Update Module

**Defect Description:**

When an administrator edits an existing assignment and uploads a new CSV file (e.g., to update the list of students or groups), the "Update" button at the bottom of the page becomes disabled or unresponsive. The user is unable to click the button to save their changes.

**Impact Analysis:**

This is a high-severity defect that blocks administrators from performing a key maintenance task: updating an assignment with new or corrected information. The only way to proceed is to abandon the changes, which is inefficient and frustrating.

**Steps to Reproduce:**

1. Navigate to the list of existing assignments.
2. Select an assignment and choose to "Edit" it.
3. On the assignment editing page, proceed to the file upload section.
4. Upload a new, valid CSV file.
5. Attempt to click the "Update" button to save the changes.

**Expected Result:**

After a new CSV file is successfully uploaded, the "Update" button should be enabled, allowing the administrator to click it and save the changes to the assignment.

**Actual Result:**

The "Update" button is inactive/unclickable, and the administrator is stuck on the page, unable to finalise the update.

**Recommendation:**

Investigate the front-end state management on the assignment edit page. There is likely a bug in the JavaScript logic that controls the enabled/disabled state of the "Update" button. The state is not being correctly refreshed or validated after the file upload event completes.