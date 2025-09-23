# Test Report: Students' Result Module Usability and Functionality

## 1.0 Introduction

**Date:** 2025-09-21

**Project:** Examiner Experience and Assessment Module

**Objective:** This document provides a detailed analysis of critical bugs and usability issues identified within the examiner-facing interfaces of the application. The scope of this report covers the examiner's workflow, from selecting a session to viewing candidate details within an assessment. The findings herein are intended to guide the development team in prioritising and resolving issues that currently impede the examiner's ability to perform their duties effectively.

## 2.0 Executive Summary

This report documents four significant defects discovered in the examiner module. These issues range from critical API integration errors to severe data presentation omissions, all of which contribute to a degraded user experience.

The key findings are:

1. A client-side routing error results in a "404 Not Found" when accessing session details, effectively blocking the examiner's workflow.
2. The "Start Assessment" button is completely unresponsive, preventing the initiation of the core assessment process.
3. Critical candidate identification data, specifically the **Index Number** and **Photo**, are missing from the assessment interface, hindering the examiner's ability to verify candidate identity.

These defects collectively represent a significant barrier to the usability of the platform for examiners. Addressing them should be a high priority to ensure the integrity and efficiency of the assessment process.

## 3.0 Detailed Findings

### 3.1 Defect ID: EXM-001 - API Request Failure When Accessing Session Details

- **Status:** New
- **Severity:** High
- **Priority:** High
- **Component:** Examiner Session Interface

**Defect Description**:

When an examiner attempts to view the details of a specific session by clicking on it from the session list, the front-end application constructs an incorrect URL for the API request. This results in a "404 Not Found" error response from the server, and the session details are not displayed to the user. The back-end API is confirmed to be functioning correctly; the fault lies entirely within the client-side application.

**Impact Analysis**:

This bug is a workflow blocker. It prevents examiners from accessing the information they need to prepare for and manage their assigned sessions, such as viewing candidate lists or session times.

**Steps to Reproduce:**

1. Log in to the application with Examiner credentials.
2. Navigate to the main "Examiner Session" interface.
3. Click on any available session in the list.
4. Observe that the application fails to load the session details.
5. Open the browser's developer tools and inspect the Network tab to confirm that a request was made to an incorrect URL, resulting in a 404 status code.

**Expected Result**:

The application should construct the correct API endpoint URL, successfully fetch the session data, and display the session details to the examiner.

**Actual Result**:

The application constructs a malformed URL, the API call fails with a 404 error, and the user is left on the same page with no feedback or data.

**Recommendation**:

The front-end development team should review the client-side logic responsible for generating API request URLs for session details. The URL construction must be corrected to match the documented and functional API endpoint contract.



### 3.2 Defect ID: EXM-002 - "Start Assessment" Button is Unresponsive

- **Status:** New
- **Severity:** Critical
- **Priority:** High
- **Component:** Examiner Session Interface

**Defect Description**:

Within the examiner session view, the "Start Assessment" button is non-functional. Clicking this button produces no discernible action, network request, or error message in the user interface or browser console.

**Impact Analysis**:

This is a critical defect as it prevents the examiner from initiating the assessment process, which is a core function of their role within the application. The entire assessment workflow is halted at this point.

**Steps to Reproduce:**

1. Log in as an Examiner and navigate to a session's detail page (once EXM-001 is resolved).
2. Locate the "Start Assessment" button for a specific candidate or the session.
3. Click the "Start Assessment" button.

**Expected Result**:

The application should either navigate the examiner to the assessment interface or initiate the assessment state, providing clear visual feedback that the action was successful.

**Actual Result**:

The button click is not registered, and the application state remains unchanged. There is no user feedback to indicate an error or that the click was processed.

**Recommendation**:

Investigate the JavaScript event handler attached to the "Start Assessment" button. Check for console errors that may be preventing the script from running. Ensure the onClick event is correctly bound to its corresponding function and that the function is implemented correctly.



### 3.3 Defect ID: EXM-003 - Missing Candidate Index Number in Assessment View

- **Status:** New
- **Severity:** Medium
- **Priority:** Medium
- **Component:** Assessment Interface

**Defect Description**:

The interface presented to the examiner during an assessment does not display the candidate's unique index number. This piece of information is essential for administrative and verification purposes.

**Impact Analysis**:

The absence of this key identifier complicates the examiner's ability to cross-reference and verify the candidate's identity against official records, potentially slowing down the assessment process and introducing room for error.

**Steps to Reproduce:**

1. Log in as an Examiner.
2. Start an assessment for any candidate (once EXM-002 is resolved).
3. Scan the assessment interface for the candidate's information.

**Expected Result**:

The candidate's index number should be clearly visible alongside their name and other details.

**Actual Result**:

The candidate's index number is not present anywhere on the screen.

**Recommendation**:

First, verify that the API endpoint serving the assessment data includes the candidate's index number in its response payload. If it does, update the front-end component to render this data field in a prominent position. If it doesn't, the back-end API must be updated to include it.



### 3.4 Defect ID: EXM-004 - Missing Candidate Photo in Assessment View

- **Status:** New
- **Severity:** Medium
- **Priority:** Medium
- **Component:** Assessment Interface

**Defect Description**:

The candidate's photograph is not displayed in the assessment interface for the examiner.

**Impact Analysis**:

The candidate's photo is a crucial element for identity verification, ensuring that the person taking the assessment is the registered candidate. Its absence removes a primary layer of identity confirmation for the examiner.

**Steps to Reproduce:**

1. Log in as an Examiner.
2. Start an assessment for any candidate (once EXM-002 is resolved).
3. Observe the area in the UI where candidate details are displayed.

**Expected Result**:

A photo of the candidate should be clearly visible to the examiner for identity verification purposes.

**Actual Result**:

There is no photo of the candidate displayed in the assessment UI.

**Recommendation**:

Confirm that the relevant API provides a URL or image data for the candidate's photo. Update the UI to include an image component that displays the photo. It is also recommended to implement a default placeholder image for cases where a photo is not available in the database.