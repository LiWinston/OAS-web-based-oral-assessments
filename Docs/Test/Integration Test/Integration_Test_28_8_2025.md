# Integration Test Report

**Report Updated**: August 28, 2025

**Test Team**: Benyuan Wang, Weiran Xu

**Test Environment**: Production Deployment

**Application URL**: http://localhost:3000/ (based on [this](https://github.com/SWEN90017-2025-SM1/OAS-web-based-oral-assessments/tree/frontend-bugfix) branch)

## Executive Summary

This document provides a live status of findings from the integration testing cycle ending August 28, 2025. The testing covered authentication, course management, user management, and critical administrator workflows.

During this cycle, a total of **24** unique issues were identified. As of this report, **12** of those issues have been resolved. There are currently **12** issues that remain **Open** and require attention. The team's priority should be to address the remaining Critical and High severity issues to ensure application stability.

## Test Environment Configuration

| Tester  | Processor                             | RAM  | Browser                                                |
| ------- | ------------------------------------- | ---- | ------------------------------------------------------ |
| Weiran  | Apple M1 Pro                          | 32G  | Chrome Version 139.0.7258.139 (Official Build) (arm64) |
| Benyuan | 12th Gen Intel(R) Core(TM) i9-12900HX | 32G  | Chrome Version 139.0.3405.111 (Official Build)         |

## Open Issues

| Issue ID       | Description                                                  | Severity | Opened On  | Status |
| -------------- | ------------------------------------------------------------ | -------- | ---------- | ------ |
| **COURSE-004** | When a course is created, the `admin_user_id` is incorrectly set to "1". The record also lacks `creation_time` and `creator` metadata. | High     | 2025-08-25 | Open   |
| **COURSE-007** | Database timestamps are stored in UTC+0 instead of the correct local timezone. | Medium   | 2025-08-25 | Open   |
| **COURSE-008** | After changing a course's status (active/inactive), the summary statistic block at the top of the page does not update without a manual refresh. | Medium   | 2025-08-28 | Open   |
| **COURSE-009** | The content displayed in the "Current Semester" section of the dashboard is incorrect. | Medium   | 2025-08-28 | Open   |
| **DASH-001**   | All links in the "Assignment Status Overview" section of the admin dashboard lead to a 404 error. | High     | 2025-08-28 | Open   |
| **USER-001**   | Students can be added without selecting the required course and assignment associations. | Medium   | 2025-08-25 | Open   |
| **USER-002**   | Users do not receive email notifications after being added to the system. Added users are not persisted in the database and disappear from the UI after the cache expires (not integrated with backend). | High     | 2025-08-25 | Open   |
| **ADMIN-001**  | "Unknown department" was incorrectly included in department count statistics. | Low      | 2025-08-25 | Open   |
| **ADMIN-002**  | Course administrator invitation emails lack a clear indication that the recipient is being invited as an administrator. | Medium   | 2025-08-25 | Open   |
| **ADMIN-003**  | Admin list UI did not update in real-time after inviting a new user. | High     | 2025-08-25 | Open   |
| **ADMIN-004**  | Super admins could not see newly activated admins without a significant delay. | High     | 2025-08-25 | Open   |
| **ADMIN-005**  | Attempts to modify a course administrator's status fail silently with no changes applied. | Critical | 2025-08-25 | Open   |

## Resolved Issues

| Issue ID       | Description                                                  | Severity | Opened On  | Fixed On   | Status |
| -------------- | ------------------------------------------------------------ | -------- | ---------- | ---------- | ------ |
| **AUTH-001**   | Password visibility toggle malfunctioned after clicking away and back. | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **AUTH-002**   | The login button state was inconsistent during slow network conditions. | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **NAV-001**    | Inconsistent and non-clickable menu structure between "My Course" and "Course Management". | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **ASSIGN-001** | Edit mode for assignments did not pre-populate previous time values. | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **ASSIGN-002** | Text layout issues were present in the assignment creation dialogue. | Low      | 2025-08-25 | 2025-08-28 | Fixed  |
| **ASSIGN-003** | No validation to ensure the total weight of assignments did not exceed 100%. | Medium   | 2025-08-27 | 2025-08-28 | Fixed  |
| **ASSIGN-004** | Assignment creation fails at the final step with an HTTP 400 error. | Critical | 2025-08-25 | 2025-08-27 | Fixed  |
| **COURSE-001** | The year filter was not dynamically generated based on available courses. | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **COURSE-002** | The Select bar on the course creation page had inconsistent UI styling. | Low      | 2025-08-25 | 2025-08-28 | Fixed  |
| **COURSE-003** | Newly created courses were not visible in the course list, even after a refresh. | High     | 2025-08-25 | 2025-08-28 | Fixed  |
| **COURSE-005** | When editing a course, the description and semester fields are not pre-populated, causing data loss if left blank. | High     | 2025-08-25 | 2025-08-27 | Fixed  |
| **COURSE-006** | There is no accessible interface to view a course's description after it has been created. | Medium   | 2025-08-25 | 2025-08-27 | Fixed  |
| **COURSE-010** | The action menu (three dots) on course cards is visible but is non-functional and cannot be clicked. | Low      | 2025-08-27 | 2025-08-28 | Fixed  |
| **RUBRIC-001** | Save confirmation dialogue was an empty black box.           | Medium   | 2025-08-25 | 2025-08-28 | Fixed  |
| **RUBRIC-002** | UI criteria disappeared from view after a successful save.   | High     | 2025-08-25 | 2025-08-28 | Fixed  |
| **RUBRIC-003** | The `updater` field in the database was not updated after modifications. | Low      | 2025-08-25 | 2025-08-28 | Fixed  |
| **RUBRIC-004** | No backend validation to prevent overlapping score ranges in rubrics. | High     | 2025-08-27 | 2025-08-28 | Fixed  |