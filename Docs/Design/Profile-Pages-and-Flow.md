# Profile Pages — Unified Design and Frontend Plan

Status: Proposed • Last updated: 2025-08-31

## Goals
- Provide consistent profile management for Admin, Examiner, and Student.
- Reuse UI primitives (`components/ui/*`) and layout chrome per role.
- Align with standardized API wrapper and auth patterns.

## Screens
- Admin: `app/admin/profile/page.jsx` (already exists) — revise to persist via Profile API.
- Examiner: `app/examiner/profile/page.jsx` (exists) — hook save actions to Profile API.
- Student: `app/student/profile/page.jsx` (new) — added, mirrors structure with student‑specific preferences.

## IA & Navigation
- Top nav profile dropdown points to `/[role]/profile` (updated student top nav).
- Student “Settings” entry now routes to `student/profile` for consistency.

## Components & Patterns
- UI: `Card`, `Button`, `Input`, `Label`, `Select`.
- State: Local component state for form, `useAuthStore` for user snapshot.
- Service: `services/profileService.js` centralizes `getProfile`, `updateProfile`, `updatePreferences`, `changePassword`.

## Data
- Profile fields: name, email (read‑only), phone; admin includes department; student includes studentId (read‑only).
- Preferences: timezone, language, notifications (role‑aware toggles).

## Save Semantics
- Client validates minimal requirements (password match/length).
- On Save/Edit: call `profileService.updateProfile` and/or `updatePreferences`.
- On password change: `profileService.changePassword`.

## Accessibility
- Labels tied to inputs, focus order preserved, clear disabled states.

## Future Enhancements
- Avatar upload, department list from `/departments`, audit timeline.


