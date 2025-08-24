# OAS Onboarding — End-to-End Flow and Frontend Plan

This document describes the complete onboarding experience across roles (Course Admin, Examiner, Student), the end-to-end system flow (from invitation to account activation), link structure best practices, required backend APIs, and the unified frontend onboarding design.

## 1) Goals and Scope

- Provide a unified onboarding experience for Course Admins, Examiners, and Students that starts from an email invitation link and finishes at the relevant dashboard.
- Make onboarding pages reusable and role-aware, aligning with the PRD while integrating with the Spring Boot backend.
- Define URL and API contracts for the email/back-end teams to enable seamless integration.
- Out of scope: generating/sending emails (handled by backend/email team). We specify contracts and link formats so they can integrate cleanly.

## 2) Roles and Flows (High-level)

- Course Admin (Flow 1): Super Admin creates an invite → Course Admin receives email → clicks link → completes onboarding → redirected to `/admin`.
- Student/Examiner (Flow 2): Course Admin creates assignment and imports CSVs → Students/Examiners receive email → click link → complete onboarding → redirected to `/student` or `/examiner`.
- Exception: Already Registered → clicking link shows an informational page and directs the user to `/login` (email prefilled), bypassing onboarding.

## 3) End-to-End System Sequence

### 3.1 Super Admin invites Course Admin

1) Super Admin inputs Course Admin details in the Super Admin UI (email, full name, optional department).
2) Frontend sends invite creation request to backend (follow the existing Super Admin API doc for the exact endpoint and payload).
3) Backend creates an invitation record (pending, single-use, short-lived), generates a secure token, and sends an email to the Course Admin with the onboarding link.
4) Course Admin clicks the link, landing on the unified `/onboarding` page (frontend).
5) Frontend calls `verify` endpoint with the token. If valid and not registered, the frontend obtains only the current-stage required fields: `fullName`, `email`, and `department` (admin only). Use these to pre-fill the wizard (email read-only). If already registered, show a “You’re already registered” screen with a login CTA.
6) On completion, frontend calls `register` with the minimal current-stage payload: `{ token, fullName, password, department? }`. Backend creates the account, associates it to institution/org context, marks the token used, and returns login tokens for auto-login.
7) Frontend logs in the user and redirects to `/admin`.

### 3.2 Course Admin imports students/examiners and creates an assignment

1) Course Admin configures a new assignment within their course.
2) Course Admin imports Student CSV and Examiner CSV in the assignment setup UI.
3) Frontend sends the import and assignment creation request to backend (CSV upload endpoints already exist in backend scope; onboarding-related invites are handled there).
4) Backend parses CSVs, creates invitation records for each new user (or flags already-registered users), generates secure tokens, and sends onboarding emails.
5) Student/Examiner clicks the link in the email → lands on `/onboarding` (frontend).
6) Frontend calls `verify`. If valid and not registered, obtain only the current-stage required fields: `fullName` and `email` (department not needed for students/examiners). Proceed through steps.
7) On completion, frontend calls `register`; backend creates the user, maps them to the course/assignment, marks token used, and returns login tokens.
8) Frontend auto-logs in and redirects to `/student` or `/examiner`.
9) For already-registered users, `verify` returns `alreadyRegistered=true`, and the frontend shows a login CTA instead of onboarding.

## 4) Onboarding Link — Best Practices

- URL format: `https://<frontend-domain>/onboarding?token=<opaque-token>`
  - Avoid embedding PII (email, name, course code) in the URL. Do not add separate email or name params.
  - Keep the token opaque and short-lived; prefer an opaque random ID mapped to a server-side record. If using JWT, include `jti` and track its status in DB (issued/used/revoked/expired) to support revocation.
- Token lifecycle:
  - Expires in a short window (e.g., 7 days) and single-use.
  - Rotated on resend; previous token invalidated.
  - Stored server-side hashed (if using opaque token) to prevent leakage risks.
- Validation:
  - `verify(token)` checks: signature (if JWT), DB status, expiry, and rate limits.
  - Returns minimal data for UI pre-fill: email, fullName, department (where applicable), role, context.
- Security:
  - Use HTTPS. Treat tokens as secrets. Do not log tokens.
  - The email field in onboarding must be read-only to preserve the invite identity.

## 5) Frontend UX Design — Unified Flow

- Single entry page: `app/(auth)/onboarding/page.jsx`.
- Shared wizard and steps in `components/onboarding/*`, role-aware via props.
- Steps by role:
  - Course Admin: Welcome → Basic Info (email read-only, full name required) → Department (required) → Password → Complete.
  - Student/Examiner: Welcome → Basic Info (email read-only, full name optional/required per policy) → Password → Complete. Optional Context Summary before Password.
  - Already Registered: Bypass steps; show informational view with “Sign in” CTA (prefill email in login page).
- Post-completion: auto-login and redirect to role dashboard (`/admin`, `/examiner`, `/student`). If backend cannot return tokens, redirect to `/login?email=...&redirect=...`.

## 6) Backend API Contracts (Proposed)

These endpoints are implemented by the backend team. The frontend relies on them to orchestrate onboarding.

### 6.1 Invitations (creation/sending)

- Super Admin → Course Admin invite
  - Follow the existing Super Admin API documentation for the invite endpoint and payload. Frontend will call that API to create invites.
  
- Course Admin → Students/Examiners invites (as part of assignment setup)
  - Usually part of assignment creation/CSV upload workflow.
  - Backend parses CSVs, creates invitations for new users, and sends emails containing onboarding links.

### 6.2 Verify onboarding token (Current Stage)

- `GET /onboarding/verify?token=<token>`
- Response for Course Admin:
  ```json
  {
    "success": true,
    "status": "valid", // valid | expired | used | invalid
    "alreadyRegistered": false,
    "role": "COURSE_ADMIN",
    "email": "user@example.edu",
    "fullName": "Alice Lee",
    "department": "Engineering"
  }
  ```
- Response for Student/Examiner (with course/assignment context):
  ```json
  {
    "success": true,
    "status": "valid",
    "alreadyRegistered": false,
    "role": "STUDENT", // or EXAMINER
    "email": "student@example.edu",
    "fullName": "John Doe",
    "courseContext": {
      "courseId": "COMP90082",
      "courseName": "Software Project",
      "courseCode": "COMP90082",
      "coordinatorName": "Dr. Alice Lee"
    },
    "assignmentContext": {
      "assignmentId": "assignment-1",
      "assignmentName": "Mid-Semester Oral Assessment"
    }
  }
  ```

### 6.3 Complete onboarding (register) — Current Stage

- `POST /onboarding/register`
- Request body (only these fields for current stage):
  ```json
  {
    "token": "<token>",
    "fullName": "Alice Lee",
    "password": "strong-password",
    "department": "Engineering" // optional; required for admin
  }
  ```
- Response on success (no `username`; `fullName` may be returned if desired):
  ```json
  {
    "success": true,
    "data": {
      "userId": 123,
      "fullName": "Alice Lee",
      "email": "user@example.edu",
      "role": "ROLE_ADMIN", // or ROLE_STUDENT | ROLE_EXAMINER
      "accessToken": "...",
      "refreshToken": "...",
      "tokenType": "Bearer",
      "expiresIn": 900
    }
  }
  ```
- Side-effects: user account created (if new), associations (course/assignment) applied, invitation marked as used.

## 7) Email Content and Link Construction

- Course Admin invite (from Super Admin):
  - Subject: "You’re invited to OAS as Course Admin"
  - Body includes: role, context of institution/department if known, and CTA button linking to `/onboarding?token=<opaque-token>`

- Student/Examiner invite (from Course Admin’s assignment):

  - Subject: "New assignment in OAS: [assignment_name]"
  - Body: "There is a new assignment [assignment_name] created by your course admin [admin_name] for course [course_name] (course code: [course_code])."
  - CTA links to `/onboarding?token=<opaque-token>`

Email team should only embed the opaque `token`. Avoid duplicating PII in the URL. The frontend obtains all prefill/context via `verify`.

## 8) Frontend Implementation Plan (Summary)

Files to add:

- `app/(auth)/onboarding/page.jsx` — Entry point that reads `token`, calls `verify`, and conditionally renders wizard or error/already-registered views.
- `components/onboarding/OnboardingLayout.jsx` — Shared layout and styling.
- `components/onboarding/OnboardingWizard.jsx` — Step orchestration with role-based configuration.
- `components/onboarding/steps/*` — Welcome, BasicInfo, Department (admin), Password, Complete, and optional ContextSummary.
- `services/onboardingService.js` — `verify(token)` and `complete(data)`.

Refactor:

- Migrate `frontend/components/admin/onboarding/*` into the shared onboarding steps, generalize props, and reuse styling.
- Keep `app/admin/onboarding/page.jsx` as a thin wrapper or redirector to `/onboarding`.

## 9) Security and Reliability

- Tokens: short-lived, single-use, revocable. Prefer opaque tokens stored hashed server-side; or JWT with DB-tracked `jti` and status.
- HTTPS only; no PII in URL; do not log tokens. Throttle verification attempts.
- Email field read-only during onboarding to preserve invite identity.
- Idempotency: re-clicking the same link after completion should present "already registered" or "link used" with a login CTA.

## 10) Error Handling and Edge Cases

- Token invalid/expired/used → Show dedicated error view with support guidance and "Go to Login" CTA.
- Already registered → Info screen + login CTA with email prefilled.
- Network failure → Display retry and non-sensitive error message.
- Password policy violations → Client-side validation + clear error messages.

## 11) Open Questions / Decisions

- Department list source for admins: initially static; later fetched from backend (e.g., `/departments`).
- Post-onboarding redirect for Students/Examiners: dashboard by default; optionally support redirect to a specific assignment in the future.
- Auto-login: recommended (return tokens from `register`), otherwise go to Login with success notice and prefilled email.
