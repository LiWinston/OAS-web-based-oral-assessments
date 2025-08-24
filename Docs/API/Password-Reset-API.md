# Password Reset API (Email Code)

This document specifies the backend API for password reset via email verification code (OTP). Applies to Students, Examiners, and Course Admins. Super Admin is excluded from self-service reset.

Base URL: `/auth/password-reset`

## 1) Request Code

- Endpoint: `POST /auth/password-reset/request`
- Auth: Public (no JWT)
- Body:
```json
{ "email": "user@example.edu" }
```
- Response: `200 OK`
```json
{ "message": "If an account exists, a verification code has been sent." }
```
- Semantics:
  - Always returns 200 and generic message to prevent account enumeration.
  - If the user exists and is not a Super Admin, generate a short-lived code, hash and store it, and email the code.
  - Throttle requests per IP and per email (e.g., cooldown 60s; daily cap).
  - If a previous valid code exists, rotate/replace it and invalidate the prior code.

## 2) Confirm Code and Reset Password

- Endpoint: `POST /auth/password-reset/confirm`
- Auth: Public (no JWT)
- Body:
```json
{
  "email": "user@example.edu",
  "code": "123456",
  "newPassword": "S3cure-long-pass"
}
```
- Response (success): `200 OK`
```json
{ "message": "Password has been reset successfully." }
```
- Response (error examples):
  - `400 Bad Request`
```json
{ "code": "INVALID_CODE", "message": "The code is invalid or expired." }
```
  - `429 Too Many Requests`
```json
{ "code": "TOO_MANY_ATTEMPTS", "message": "Too many attempts. Please request a new code." }
```
  - `400 Bad Request` (password policy)
```json
{ "code": "WEAK_PASSWORD", "message": "Password does not meet complexity requirements." }
```
- Semantics:
  - Validate code: correct, unexpired, unused, within attempt limits; mark used on success.
  - Validate password: meets policy and differs from current password.
  - Update password (bcrypt), revoke all refresh tokens, and log audit event.

## Error Codes (suggested)

- `INVALID_CODE`: Code not found, wrong, or expired.
- `TOO_MANY_ATTEMPTS`: Attempt limit exceeded; user must request a new code.
- `RATE_LIMITED`: Request throttled; respect `Retry-After` header.
- `WEAK_PASSWORD`: New password violates policy.
- `NOT_ALLOWED`: Role not permitted (e.g., Super Admin).

## Validation & Constraints

- Email: RFC format; case-insensitive lookup.
- Code: fixed length (e.g., 6 digits); numeric.
- Password: backend policy (min length, complexity) and must differ from existing password.
- Attempts: e.g., max 5 per code; lockout on exceed until new request.
- TTL: e.g., 10 minutes; configurable via env/property.

## Security

- Do not disclose account existence in any response.
- Hash codes at rest (e.g., SHA-256); compare in constant time.
- Apply per-IP and per-email rate limiting.
- Store metadata for audit: issued time, expiry, attempts, used time, IP, User-Agent.
- On success, revoke all active refresh tokens for the user.

## Implementation Notes (Backend)

- Add `password_reset_codes` table/entity:
  - `id`, `user_id`, `code_hash`, `expires_at`, `used_at`, `attempt_count`, `created_at`, `last_sent_at`, `created_ip`, `user_agent`
- Update `SecurityConfig` to `.antMatchers("/auth/password-reset/**").permitAll()`.
- Extend `EmailService` with `sendPasswordResetCode(user, code)`.
- Extend `ISysUserService` with `updatePassword(...)`; reuse `PasswordEncoder` to check difference from current.
- Revoke refresh tokens via `RefreshTokenMapper.revokeAllByUserId(userId)`.

## Implementation Notes (Frontend)

- Step 1 page: `/(auth)/forgot-password` posts to `/auth/password-reset/request`.
- Step 2 page: `/(auth)/reset-password` posts to `/auth/password-reset/confirm`.
- Keep the email from step 1 for step 2; validate code length and password.
- Replace current “Forgot Password” dialog with a link to `/(auth)/forgot-password`.

