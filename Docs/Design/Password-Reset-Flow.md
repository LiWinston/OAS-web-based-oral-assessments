# OAS Password Reset Flow (Email Code)

This document describes the end-to-end password reset experience for Students, Examiners, and Course Admins using an email verification code (OTP). Super Admins are excluded from self-service reset.

## Goals

- Provide a simple, secure password reset using an email-delivered verification code.
- Prevent account enumeration and brute-force attempts.
- Ensure the new password differs from the current password.

## Scope

- In-scope roles: Student, Examiner, Course Admin.
- Out-of-scope (cannot reset): Super Admin.
- Architecture: Next.js 15 frontend and Spring Boot backend with JWT auth.

## High-Level Flow

1) User opens Forgot Password
- Entry points:
  - Login page link: `Forgot Password?`
  - Direct URL: `/forgot-password`
- User enters their email address and submits.

2) Backend sends verification code (OTP)
- Frontend calls `POST /auth/password-reset/request` with `{ email }`.
- Backend throttles/rate-limits requests and always responds `200` with a generic message (no account enumeration).
- If the user exists and is not a Super Admin, backend creates a short-lived, single-use code (e.g., 6 digits), stores a hash, and emails the code with expiry (e.g., 10 minutes).

3) User verifies code and sets a new password
- Frontend shows a second step to enter:
  - The verification code
  - New password
  - Confirm new password
- Frontend calls `POST /auth/password-reset/confirm` with `{ email, code, newPassword }`.
- Backend verifies:
  - Code is valid, unexpired, unused, and within attempt limits
  - User exists and is eligible (non-super-admin)
  - New password differs from the current password (checked via password encoder)
- If valid, backend:
  - Updates the user password (bcrypt)
  - Marks the code as used
  - Revokes all active refresh tokens for the user
  - Returns `200` success

4) User sees success screen
- Offer a link back to login.

## UX Details

- Step 1 (Email Entry):
  - Form: email (required, format validated)
  - After submit: Always show generic success (“If an account exists, a code was sent”).
  - Resend: Provide a resend link/button with a short cooldown (e.g., 60 seconds).

- Step 2 (Code + New Password):
  - Fields: code (numeric, fixed length), new password, confirm new password
  - Password policy: show rules inline (min length, complexity as per backend)
  - Error states: invalid/expired code; too many attempts; lockout timing; generic safe copy

- Accessibility:
  - Proper labels, error messages tied to inputs, focus management between steps.

- Copy & Enumeration Resistance:
  - Do not reveal whether the entered email exists at any step.
  - Timings and responses should be consistent.

## Security Considerations

- Code generation: random 6–8 digits or alpha-numeric; store only a secure hash (e.g., SHA-256).
- TTL: 10 minutes (configurable); single-use; maximum attempts (e.g., 5); resend cooldown per email/IP.
- Rate limiting: per IP and per email for request and confirm endpoints.
- Password validation: enforce server-side policy and ensure it differs from current password using the password encoder’s `matches` check.
- Post-reset: revoke/clear all refresh tokens; require login again.
- Logging: audit issuance and resets; never log email codes or passwords.

## Frontend Implementation Notes

- Routes:
  - `/(auth)/forgot-password` (step 1)
  - `/(auth)/reset-password` (step 2) — can also be a single 2-step page if preferred.
- State handling: after step 1, keep the submitted email in state or query param.
- Validation: zod-based for email, code length, and password rules.
- Error handling: show user-friendly errors while keeping responses enumeration-safe.
- Update `/(auth)/login/page.jsx`: change the current modal into a link to `/forgot-password`.

## Backend Implementation Notes

- Endpoints:
  - `POST /auth/password-reset/request` — body: `{ email }` — returns 200 always.
  - `POST /auth/password-reset/confirm` — body: `{ email, code, newPassword }` — returns 200 on success; 400/401 for invalid/expired/attempts.
- SecurityConfig: permitAll for both endpoints.
- Storage: `password_reset_codes` table with fields:
  - `id`, `user_id`, `code_hash`, `expires_at`, `used_at`, `attempt_count`, `created_at`, `last_sent_at`, `created_ip`, `user_agent`
  - Index on `user_id` and `expires_at`.
- Services:
  - `PasswordResetService` (issue, resend, verify, consume)
  - Extend `EmailService` with `sendPasswordResetCode(user, code)`
  - Extend `ISysUserService` with `updatePassword(userId, encodedPassword)` and revoke refresh tokens for that user
- Policies:
  - Max attempts: 5; cooldown between resends: 60s; rotate code on resend.
  - Disallow Super Admin from resetting (act as no-op but respond 200 on request).

## Edge Cases

- Multiple requests before confirm: latest code invalidates prior codes.
- Expired code: clear and ask to request a new one.
- Excess attempts: temporary lockout and require new request.
- Email typos: generic responses avoid enumeration; user can retry.

## Acceptance Criteria

- Students, Examiners, Course Admins can reset via email code; Super Admin cannot.
- UI never reveals whether an email exists.
- New password cannot equal current password.
- Codes are single-use, expire, rate-limited, and hashed at rest.
- All refresh tokens are revoked upon successful reset.

## Implementation Plan (Checklist)

- Backend
  - [ ] Create `password_reset_codes` table and entity + mapper
  - [ ] Implement `PasswordResetService` (issue, resend, verify, consume)
  - [ ] Add controllers: `POST /auth/password-reset/request` and `/confirm`
  - [ ] Extend `EmailService` with code email template and sender
  - [ ] Update `SecurityConfig` to permit `/auth/password-reset/**`
  - [ ] Enforce password policy and “not same as previous” check
  - [ ] Revoke refresh tokens on successful reset
  - [ ] Add rate limiting and attempt tracking
  - [ ] Add audit logging (issuance, verification, reset)

- Frontend
  - [ ] Add `/(auth)/forgot-password` page (email submit + success state)
  - [ ] Add `/(auth)/reset-password` page (code + new password)
  - [ ] Wire API calls via `authService` (request + confirm)
  - [ ] Replace login modal with link to `/forgot-password`
  - [ ] Form validation (zod) and UX states (loading, errors, resend)
  - [ ] Accessibility checks and tests

- Testing & Docs
  - [ ] Unit/integration tests for backend flows
  - [ ] Frontend component tests for forms and navigation
  - [ ] Update README and team docs; confirm API doc alignment
