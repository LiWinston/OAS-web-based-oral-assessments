# API Test Report: Admin Assessment Management Endpoints

## 1.0 Introduction

**Date:** 2025-09-22

**Project:** Admin API Module - Assessment Management

**Objective:** This report provides a detailed analysis of the API endpoints related to assessment management from an administrator's perspective. It documents a range of issues discovered during testing, including data integrity problems, incomplete or incorrect data structures, hardcoded responses, and unimplemented business logic. The findings are intended to provide the back-end development team with clear, actionable feedback to ensure the API is robust, reliable, and provides complete data to the client application.

## 2.0 Executive Summary

Testing of the admin-facing assessment APIs has revealed several critical and major defects that significantly impact the functionality and reliability of the platform. A recurring theme across multiple endpoints is the presence of incomplete data, hardcoded "success" responses that do not reflect the true state of the database, and logic marked as "TODO," indicating unimplemented features.

**Key findings include:**

- **Widespread Data Incompleteness:** Core objects like `group` and `session` are frequently returned as `null` or are missing essential fields.
- **Deceptive Success Responses:** Endpoints for critical actions like releasing results (`/release`) and reopening for review (`/review`) return static, hardcoded `true` values, even when the underlying database operations are incomplete or incorrect.
- **Unimplemented Core Logic:** Several crucial features, such as updating a final score (`/final-score`) and populating detailed examiner feedback (`/examiners/...`), are marked as "TODO" in the codebase and are non-functional.
- **Data Model and Logic Concerns:** There are inconsistencies in how entities are identified (e.g., `submissionId`, `entityId`) and fundamental flaws in data visibility, such as allowing admins to view results for unsubmitted assessments.

These issues combined prevent administrators from reliably managing, reviewing, and finalizing assessments. This report provides a detailed breakdown of each endpoint and its associated defects.

## 3.0 Detailed Findings

### 3.1 Endpoint: `/api/admin/.../assessments` (List Assessments)

- **Defect ID:** API-ADM-005
- **Status:** New
- **Severity:** High
- **Description:** The endpoint successfully returns a list of assessments, but the data for each assessment object is severely incomplete and contains logical flaws.
  - **Data Integrity Issues**:
    - `assessment.key.submissionId`: This field is returned as `0`, which appears to be an incorrect or uninitialized value.
    - `assessment.key.entityId`: The use of this ID is unclear. It is recommended to use an `enrollment_id` to reliably join with the `session_student` table for student information.
    - `assessment.group`: This object is consistently `null`, despite the assessment `kind` being "GROUP". The correct group information is not being looked up from the `student_group` table.
    - `session` Object: The nested `session` object is missing key fields. `start`, `end`, and `venue` are all `null`, even though this data exists in the database.
    - `computed.manualOverride`: This field is `null`. The reason for this is unclear and needs investigation.
  - **Business Logic Flaw**:
    - The API returns assessments that are not in a "SUBMITTED" state. According to business rules, administrators should not be able to view or access these results until they have been submitted.
- **Impact Analysis:** This endpoint provides administrators with an incomplete and misleading view of assessments. The lack of group and session details makes it difficult to understand the context of each assessment without consulting the database directly. The logical flaw of showing unsubmitted results could lead to confusion and premature actions by admins.
- **Recommendations:**
  1. Refactor the data retrieval logic to correctly populate the `submissionId`, `group`, and all fields within the `session` object.
  2. Clarify the purpose of `entityId` and consider using a more direct key for linking student data.
  3. Implement a mandatory filter to ensure that only assessments with a "SUBMITTED" status are returned by this endpoint.

### 3.2 Endpoint: `/api/admin/.../assessments/{{submissionId}}` (Get Assessment Detail)

- **Defect ID:** API-ADM-006
- **Status:** New
- **Severity:** High
- **Description:** This endpoint for fetching a single assessment's details inherits many of the data integrity issues from the list endpoint and introduces new ones.
  - **Recurring Issues:** `assessment.key.submissionId` is incorrect, `entityId` is unclear, and the `group` object is `null`.
  - **Data Regression:** The `session` object is entirely `null`, which is worse than the list endpoint where at least the object shell was present. A `sessionId` exists, so the session data should be populated.
  - **Rubric Data Issues:**
    - `criterionId` and `levelId` use verbose string identifiers (e.g., "Communication Skills1"). It is recommended to use standardized, concise IDs (e.g., "C1", "L1") as per API documentation for easier parsing on the client-side.
    - The meaning of `performanceLevels.value` (e.g., 85.0) is ambiguous. It is unclear if this represents an upper or lower bound for that performance level, which requires clarification with the front-end team.
  - **Hardcoded/Unclear Fields:**
    - `releaseStatus`: The back-end logic is hardcoded to always return `NOT_RELEASED` for this field.
    - `computed` Fields: The meaning and calculation of `averageScorePct1dp` and `effectiveFinalScorePct1dp` are not clear, although they appear to be derived from the `total_score` field in the database.
- **Impact Analysis:** This endpoint fails to provide a complete and accurate view of an assessment. The null `session` object, ambiguous rubric values, and hardcoded status make it unreliable for administrative review.
- **Recommendations:**
  1. Resolve the recurring data integrity issues inherited from the list endpoint.
  2. Ensure the `session` object is fully populated. There is no reason for it to be null when a `sessionId` is available.
  3. Standardize the IDs used within the `rubric` object.
  4. Define and document the business logic for `performanceLevels.value` and the `computed` scores.
  5. Replace the hardcoded `releaseStatus` with the actual value from the database.

### 3.3 Endpoint: `/api/admin/.../examiners/{{examinerId}}` (Get Examiner Assessment Details)

- **Defect ID:** API-ADM-007
- **Status:** New
- **Severity:** High
- **Description:** The `items` array in the response, which is meant to contain the detailed breakdown of the examiner's scoring against the rubric, is an unimplemented feature marked as a "TODO" in the code.
- **Impact Analysis:** This is a critical omission. Administrators cannot see how an examiner has scored a candidate against individual criteria, preventing a thorough review of the assessment.
- **Recommendation:** Prioritize the implementation of the logic required to populate the `items` array with the examiner's specific ratings.

### 3.4 Endpoint: `/api/admin/.../release` (Release Assessment Results)

- **Defect ID:** API-ADM-008
- **Status:** New
- **Severity:** Critical
- **Description:** This endpoint is fundamentally broken.
  - It returns a static response where `released` is always `true`.
  - The `notifiedStudents` field is a "TODO" and does not return the actual count.
  - Most importantly, the back-end database mapper is incorrect, so the assessment status is **not updated** in the database upon calling this endpoint.
- **Impact Analysis:** Critical failure. The API provides a deceptive success response, leading administrators to believe they have released results to students when, in fact, no action has been taken in the database. This can cause significant operational delays and confusion.
- **Recommendation:** This endpoint requires an immediate and high-priority fix. The database mapper must be corrected to update the assessment status. The response fields must reflect the actual outcome of the release and notification operations.

### 3.5 Endpoint: `/api/admin/.../review` (Reopen Assessment for Review)、

- **Defect ID:** API-ADM-009
- **Status:** New
- **Severity:** Medium
- **Description:** While the primary function of updating the assessment status to "reopen" in the database works correctly, the API response is misleading as it contains hardcoded values. `reopened` is always `true`, and `releaseStatus` is always `NOT_RELEASED`.
- **Impact Analysis:** The hardcoded response prevents client applications from accurately reflecting the state of the system, potentially causing minor UI discrepancies.
- **Recommendation:** Refactor the response generation to use real data from the database rather than static values.

### 3.6 Endpoint: `/api/admin/.../final-score` (Update Final Score)

- **Defect ID:** API-ADM-010
- **Status:** New
- **Severity:** Critical
- **Description:** This endpoint is entirely non-functional. The database mapper for updating the score is marked as a "TODO" and has not been implemented. Furthermore, the response body is generated by reusing the method from the "Get Assessment Detail" endpoint, inheriting all of its data flaws.
- **Impact Analysis:** A core administrative function—overriding or setting a final score—is completely missing. This is a critical gap in functionality.
- **Recommendation:** This feature needs to be implemented from scratch. This includes writing the business logic, implementing the database mapper to update the score, and creating a dedicated, accurate response body for this action.