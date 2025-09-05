# OAS Refinement Plan

This document outlines the detailed refinement plan based on the PRD, frontend README, and the client meeting feedback. Scope excludes Admin Timeslot management and Super Admin features, which are being handled by colleagues.

## Scope & Exclusions

- In scope: Assignment creation flow, CSV imports, rubric builder, examiner marking UI, student experience (non-timeslot), notifications/emails, results/aggregation/export, authentication session UX, general UX/copy.
- Excluded: Admin Timeslot management refinements (per-session examiner assignment, session capacity, conflict checks, calendar UI, schedule navigation, dropdown fixes, student capacity display) and Super Admin refinements (course counts, invite UI/feedback, email content).

## Priority Themes (ordered)

1) Assignment creation flow correctness (validation, gating, clear guidance)
2) CSV import reliability and feedback (students/examiners)
3) Rubric builder clarity and validation
4) Result handling: draft/submit, notes visibility, autosave (examiner UI)
5) Student results visibility and rescheduling toggle
6) Notifications/emails for key events
7) Aggregation + Canvas export
8) Session/auth UX polish

## Detailed Refinements & Acceptance Criteria

### 1. Assignment Creation (Wizard)

- End date validation: End datetime must be after start. Disable Next and show inline error; set `min` on end input to start value.
- Weight field: Validate 0–100; show helper text “Total of all course assignments must not exceed 100%.” Keep room for optional course-total check when data is available.
- Step gating: Step 1 must be valid to proceed. Step 2 requires both Student CSV and Examiner CSV to be selected and validated (preview success) before proceeding to Summary.
- Submit validation: Re-validate Steps 1 and 2 before create; block and surface errors.
- Post‑creation cue (Phase 2): After successful create+uploads, provide clear “Next steps” (Build Rubric, Configure Schedule). Parent handler may redirect; keep a toast and CTA links in Summary.

### 2. CSV Imports (Students & Examiners)

- Templates: Add “Download template” (link or modal) for expected columns. Ignore extra columns in parser; validate required fields with precise row/column errors (service layer/back‑end alignment).
- Examiner CSV: Implement proper preview API usage; show preview summary (total/new/existing) and errors.
- Mandatory in wizard: Both CSVs must be uploaded and validated to proceed to Summary.
- Result UI: Show processed counts and allow re-upload; errors in a dismissible block.

### 3. Rubric Builder

- Points vs % basis: Allow basis toggle; rename “Points” → “Total Points” in UI; keep calculations consistent.
- Weight sum: Real-time total; block save if ≠ 100% (when % basis).
- Level ranges: Validate coverage and non-overlap after add/remove; show warning if gaps.
- Copy polish: Singular/plural (“Criterion”), help text for “Numeric vs Descriptive”; hide unsupported “Descriptive” if needed.
- Preview panel: Make scrollable/responsive.

### 4. Examiner Marking

- Notes field: Label clearly “Visible to admin”. Ensure admin view access.
- Draft vs Submit: Save Draft, Submit Final locks; confirm dialog; admin unlock path.
- Autosave: Debounced autosave with “Last saved …” indicator.
- Comment library: Add-on-the-fly from marking; de-duplication and sharing across examiners per assignment.

### 5. Student Experience (Non‑Timeslot)

- Rescheduling toggle: Enforce assignment setting and deadline; disable with informative message when closed.
- Results: Hide until release; show clear “not released” state. Results page shows rubric breakdown and feedback once released.

### 6. Notifications & Emails

- Booking confirmation (student) + optional ICS; reminders for students/examiners.
- Results released email linking to results page.
- Branding: Subject templates and footer to reduce spam likelihood.

### 7. Results, Aggregation, Export

- Aggregation rules: avg/max/min selectable per assignment; compute final per student.
- Admin review screen: per student/group breakdown and final mark; bulk Release Results with status indicators.
- Canvas CSV export: Generate grade CSV matching Canvas format; validate columns; provide success/failure summary.

### 8. Auth & Sessions

- Multi-session policy: Either support concurrent sessions or display “signed in elsewhere” reason on forced logout.
- Token expiry UX: Consistent expired/invalid token messaging with redirect preserving intent.

### 9. General UX/Copy

- Terminology: Standardize “Examiner”.
- Remove placeholders; hide unfinished widgets.
- Live refresh after key actions (create/edit/import) without manual reload.
- Error patterns: Inline errors + toasts with actionable next steps.

## Phased Timeline

- Phase A (now): Assignment Creation gating + validation; Examiner CSV preview fix; copy updates; date min; Next-button disable logic.
- Phase B: CSV templates and improved error surface; Rubric validations; preview scroll fix.
- Phase C: Marking autosave/draft/submit; notes visibility; student result visibility.
- Phase D: Notifications; results aggregation UI; Canvas export.
- Phase E: Auth session UX; general polish and QA walkthroughs.

## Testing Strategy

- Unit: validation functions for dates/weights and step gating.
- Integration: wizard flow with valid/invalid inputs; CSV preview success/failure.
- UAT: end‑to‑end create assignment → CSVs → summary → create, verifying toasts and Next-step prompts.

## Risks & Mitigations

- Backend/API mismatches for CSV and templates → coordinate contracts, add defensive parsing and clear UI error mapping.
- Course weight total check needs course context → design optional prop/callback for future integration.

