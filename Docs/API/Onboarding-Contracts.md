# OAS Onboarding — API and Integration Contracts

This document defines the proposed backend endpoints and contracts the frontend depends on to deliver the unified onboarding experience, plus integration notes for the email team.

> Note: Endpoint paths are illustrative. Backend team can adjust naming while preserving semantics and payloads.

## 1) Invitation Creation (Super Admin → Course Admin)

Follow the existing Super Admin API documentation for the invite endpoint and payload. The frontend will integrate with that API to create Course Admin invitations.

Backend Responsibilities (unchanged)
- Persist an invitation record with status `PENDING`, expiry (e.g., 7 days), and target role `ROLE_ADMIN`.
- Generate a secure, single-use token (opaque recommended; store hashed value with metadata and `jti`).
- Send onboarding email with link `https://<frontend-domain>/onboarding?token=<opaque-token>`.
- Log audit trail (inviter, invitee email, createdAt, expiresAt).

## 2) Invitation Creation (Course Admin → Students/Examiners)

Trigger
- During assignment creation and CSV import for students/examiners.

Backend Responsibilities
- Parse CSVs, deduplicate, identify which users are new vs. existing.
- For new users, create invitation records with role `ROLE_STUDENT` or `ROLE_EXAMINER` and context (courseId, assignmentId).
- Generate secure tokens and send onboarding emails with link `https://<frontend-domain>/onboarding?token=<opaque-token>`.
- For existing users, send a notification email without an onboarding requirement (same content, but clicking goes to login prompt after verification).

## 3) Verify Onboarding Token

Endpoint
- `GET /onboarding/verify?token=<token>`

Response (success example — Course Admin)
```json
{
  "success": true,
  "status": "valid",  
  "alreadyRegistered": false,
  "role": "COURSE_ADMIN",   
  "email": "admin@example.edu",
  "fullName": "Alice Lee",
  "department": "Engineering"
}
```

Response (success example — Student/Examiner with context)
```json
{
  "success": true,
  "status": "valid",
  "alreadyRegistered": false,
  "role": "STUDENT",   
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

Response (already registered)
```json
{
  "success": true,
  "status": "valid",
  "alreadyRegistered": true,
  "role": "STUDENT",
  "email": "student@example.edu"
}
```

Response (invalid/expired/used)
```json
{ "success": false, "status": "expired", "message": "Link expired" }
```

Backend Responsibilities
- Validate token (expiry, not used/revoked). If JWT, validate signature and `jti`; cross-check DB record.
- Determine `alreadyRegistered` by email lookup.
- Return minimal data needed for prefill and UI context. Never return the raw token.

## 4) Complete Onboarding (Register)

Endpoint
- `POST /onboarding/register`

Request (only fields needed at current stage)
```json
{
  "token": "<opaque-or-jwt>",
  "fullName": "Alice Lee",
  "password": "strong-password",
  "department": "Engineering"
}
```

Response (preferred for auto-login; no `username`, use `fullName` if needed)
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "fullName": "Alice Lee",
    "email": "admin@example.edu",
    "role": "ROLE_ADMIN",
    "accessToken": "...",
    "refreshToken": "...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

Response (alternative if not returning tokens)
```json
{
  "success": true,
  "message": "Account created. Please sign in."
}
```

Backend Responsibilities
- Validate token again (single-use). Enforce email immutability.
- Create or update the user record, apply role, set department (if admin), link user to course/assignment.
- Mark invitation as `USED` with `usedAt` timestamp.
- Prefer returning auth tokens to streamline redirect; otherwise frontend redirects to `login` with prefilled email.

## 5) Optional Endpoints

- `POST /onboarding/resend` — Allow re-sending onboarding email (enforce rate limits).
- `GET /departments` — Provide department list for Course Admin step (replace static list).

## 6) Token and Link Best Practices

- Token
  - Opaque random identifier (recommended) stored hashed in DB with metadata (email, role, context, expiresAt, status, jti).
  - If JWT is preferred, still store `jti` + status in DB to support revocation/one-time use.
  - Single-use, short-lived (e.g., 7 days), rotate on resend.

- Link
  - `https://<frontend-domain>/onboarding?token=<token>` (no PII in URL).
  - Use HTTPS only; never log full URLs server-side where tokens could leak.
  - Email templates should avoid adding email/name/course as query params—frontend resolves via `verify`.

## 7) Frontend Consumption

- The frontend calls `GET /onboarding/verify` on page load using the query `token` and renders according to `status` and `alreadyRegistered`.
- The email field in onboarding is read-only and sourced from `verify` response.
- On final submit, the frontend calls `POST /onboarding/register`. If tokens are returned, it auto-logs in and redirects by role; otherwise it redirects to `/login?email=<prefill>&redirect=<dashboard>`.

## 8) Email Team Integration

- Backend is the source of truth for: creating invitation records, generating tokens, and sending emails.
- Email templates:
  - Course Admin: role-specific invite.
  - Student/Examiner: “New assignment [assignment_name] by [admin_name] for [course_name] ([course_code]).”
  - All templates: use a CTA button to `https://<frontend-domain>/onboarding?token=<token>`.
- Avoid placing user-identifying info in the URL. The frontend will fetch context from the backend via `verify`.
