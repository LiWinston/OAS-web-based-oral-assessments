# Integration Test Report

**Test Date:** August 25th, 2025 
**Test Team:** Benyuan Wang, Weiran Xu 
**Test Environment:** Production Deployment 
**Application URL:** https://frontend-oas1.anzupop.com/login

## Executive Summary

This document presents the findings of comprehensive integration testing conducted on the deployed application. The testing covered critical user workflows, including authentication, administrative functions, course management, and user management. Multiple issues were identified across different modules, ranging from UI/UX inconsistencies to backend data integrity problems.

## Test Environment Configuration

| Tester  | Processor                             | RAM | Browser                                               |
|---------|---------------------------------------|-----|-------------------------------------------------------|
| Weiran  | Apple M1 Pro                          | 32G | Chrome Version 139.0.7258.139 (Official Build) (arm64) |
| Benyuan | 12th Gen Intel(R) Core(TM) i9-12900HX | 32G | Chrome Version 139.0.3405.111 (Official Build)        |

## Test Results by Module

### 1. Authentication Module

#### Issues Identified:

**AUTH-001: Password Visibility Toggle Malfunction**
- **Severity:** Medium
- **Description:** After entering the password and clicking outside the field, clicking back on the password field fails to toggle the visibility state
- **Impact:** Poor user experience, accessibility concerns
- **Status:** Open

**AUTH-002: Login Button State Inconsistency**
- **Severity:** Medium  
- **Description:** During slow network conditions or delayed authentication, the login button reverts from "loading" state back to "clickable" state prematurely, causing user confusion
- **Impact:** User experience degradation, potential for multiple submission attempts
- **Status:** Open

### 2. Super Administrator Module

#### Issues Identified:

**ADMIN-001: Department Count Logic Error**
- **Severity:** Low
- **Description:** "Unknown department" entries are incorrectly included in total department count statistics
- **Impact:** Inaccurate reporting and analytics
- **Status:** Open

**ADMIN-002: Invitation Email Content Inadequate**
- **Severity:** Medium
- **Description:** Course administrator invitation emails lack a clear indication that the recipient is being invited as an administrator
- **Impact:** Role confusion, delayed user activation
- **Status:** Open

**ADMIN-003: Real-time UI Update Failure**
- **Severity:** High
- **Description:** After inviting new course administrators, the admin list does not reflect the new user or their pending activation status, despite successful database insertion
- **Expected:** New admin should appear with "Pending" status
- **Actual:** No UI update, requires manual refresh
- **Impact:** Administrative workflow disruption
- **Status:** Open

**ADMIN-004: Admin Visibility Synchronization Issue**
- **Severity:** High
- **Description:** After email link activation and login completion, super administrators cannot immediately view the newly activated admin. Issue persists despite filter changes, course switching, and page refreshes
- **Impact:** Administrative oversight limitations
- **Status:** Open

**ADMIN-005: Course Admin Status Update Failure**
- **Severity:** Critical
- **Description:** Attempts to modify course administrator status fail silently - no changes are applied
- **Impact:** Administrative control loss, security concerns
- **Status:** Open

### 3. Administrator Module

#### Navigation Issues:

**NAV-001: Inconsistent Menu Structure**
- **Severity:** Medium
- **Description:** "My Course" and "Course Management" represent the same page but appear as separate menu levels. "My Course" is non-clickable. Menu structure inconsistency exists between the Course and User pages
- **Impact:** Navigation confusion, UX inconsistency
- **Status:** Open

#### 3a. Assignment Management

**ASSIGN-001: Default Value Missing in Edit Mode**
- **Severity:** Medium
- **Description:** When editing assignment "Scheduling & Grading" settings, previous time values are not populated as defaults
- **Impact:** Data loss risk, poor user experience
- **Status:** Open

**ASSIGN-002: Layout Issues in Creation Dialogue**

- **Severity:** Low
- **Description:** Text layout problems in the step flow section of the assignment creation modal
- **Impact:** Visual presentation issues
- **Status:** Open

**ASSIGN-003: Assignment Creation Failure**

- **Severity:** Critical
- **Description:** Assignment creation fails at the final step with an HTTP 400 error
- **Error Message:** `{"success":false,"code":"400","data":"Request method 'GET' not supported"}`
- **Impact:** Core functionality failure
- **Status:** Open

#### 3b. Course Management

**COURSE-001: Year Filter Generation Issue**
- **Severity:** Medium
- **Description:** Year filter options are not dynamically generated based on existing courses (e.g., courses exist for 2026 but the filter option is missing)
- **Impact:** Content discoverability issues
- **Status:** Open

**COURSE-002: UI Style Inconsistency**
- **Severity:** Low
- **Description:** The Select bar styling in the course creation page differs from the global application theme
- **Impact:** Visual consistency issues
- **Status:** Open

**COURSE-003: Course Visibility After Creation**
- **Severity:** High
- **Description:** Newly created courses are not visible in the course list, even after a page refresh
- **Impact:** Content management workflow disruption
- **Status:** Open

**COURSE-004: Incorrect Admin ID Assignment**
- **Severity:** High
- **Description:** Created courses show adminID as "1" instead of the actual user account ID
- **Impact:** Data integrity issues, ownership tracking problems
- **Status:** Open

**COURSE-005: Data Loss During Course Updates**
- **Severity:** High
- **Description:** When editing the course description and semester, the original data is not pre-populated. If fields are left empty, original data is lost. Additionally, the `admin_user_id` field reverts to "1" after updates
- **Impact:** Data loss, ownership integrity issues
- **Status:** Open

**COURSE-006: Course Description Visibility**

- **Severity:** Medium
- **Description:** No accessible interface to view course descriptions after creation
- **Impact:** Information accessibility limitations
- **Status:** Open

**COURSE-007: Timezone Configuration Error**
- **Severity:** Medium
- **Description:** Database timestamps are stored in UTC+0 instead of the local timezone
- **Impact:** Time-related data accuracy issues
- **Status:** Open

#### 3c. Rubric Management

**RUBRIC-001: Save Dialogue Display Issue**

- **Severity:** Medium
- **Description:** The Save confirmation dialogue shows as a small black block with no content
- **Impact:** User feedback mechanism failure
- **Status:** Open

**RUBRIC-002: Criteria Disappearance After Save**
- **Severity:** High
- **Description:** Although the rubric data is successfully saved to the database, the criteria disappear from the UI after the save operation
- **Impact:** Content management workflow disruption
- **Status:** Open

**RUBRIC-003: Updater Field Not Maintained**
- **Severity:** Low
- **Description:** Database updater field remains unchanged after modifications
- **Impact:** Audit trail integrity issues
- **Status:** Open

### 4. User Management Module

**USER-001: Incomplete Student Registration Validation**
- **Severity:** Medium
- **Description:** Students can be added without selecting the required course and assignment associations
- **Impact:** Data integrity issues, incomplete user setup
- **Status:** Open

**USER-002: Email Notification Failure**
- **Severity:** High
- **Description:** Users do not receive email notifications after being added to the system
- **Impact:** User activation workflow failure
- **Status:** Open

**USER-003: Database Synchronisation Issue**

- **Severity:** Critical
- **Description:** Added users are not persisted in the database despite the temporary frontend cache display. Users disappear from the interface after cache expiration
- **Impact:** Data persistence failure, user management system breakdown
- **Status:** Open

## Summary and Recommendations

### Critical Issues (Immediate Attention Required)
- Assignment creation complete failure
- Course admin status update failure  
- User data persistence failure
- Email notification system failure

### High Priority Issues
- Real-time UI synchronisation problems
- Data integrity issues with admin ID assignments
- Course visibility and update problems

### Recommendations
1. **Immediate:** Address all critical issues blocking core functionality
2. **Short-term:** Implement proper error handling and user feedback mechanisms
3. **Medium-term:** Establish comprehensive UI state management and real-time synchronisation
4. **Long-term:** Implement thorough integration testing in the CI/CD pipeline

### Test Coverage
**Test Completion Status:** Complete 
**Total Issues Identified:** 20 
**Critical:** 4 | **High:** 6 | **Medium:** 8 | **Low:** 2
