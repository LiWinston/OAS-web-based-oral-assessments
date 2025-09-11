# Student View My Groups — User Flow (Final)

Version: 1.0 • Status: Proposed for Approval • Owner: Frontend Architecture • Last updated: 2025‑08‑30

## Scope & Baseline

This document specifies the end‑to‑end “My Groups” experience for students, aligned with:

- PRD principle: group membership is managed at the assignment level (assignment is the unit of grouping).
- Visibility: show only active/current groups; past/archived groups are not displayed in this feature.

- Tech baseline: Next.js 15 frontend; Spring Boot backend; standardized API wrapper and time format (ISO‑8601 with timezone).

What this covers

- Groups Overview: for each relevant assignment, show the student's current group (active only).
- Group Details: view members.

Out of scope

- Showing past/archived groups (explicitly excluded).
- Managing group membership from the student side (roster is imported/owned by Course Admin).

---

## What changed since MVP notes

- Removed “Past Groups” tab and all related UI. Only active groups are visible by design.
- Clarified “assignment‑level” grouping: each listed group belongs to a specific assignment (card and detail clearly show Course/Assignment context).

- Time format unified to ISO‑8601 with timezone throughout.

---

## Roles, Entities & Definitions

- Student: authenticated user viewing their current groups.
- Assignment: assessment configured by Course Admin; has type INDIVIDUAL | GROUP | MIXED.
- Group (assignment‑level): { groupId, groupName, assignmentId, assignmentName, courseCode, semester, members[] }.
- Booking (group entity): current active booking (if any) for this assignment; booking history contains prior completed/cancelled sessions for audit.

---

## Preconditions

1. Student is rostered into the assignment (CSV import complete); group membership exists for group/mixed assignments.
2. Assignment is active/current (per course term/semester). Archived terms are excluded from this feature’s default view.
3. If a booking exists, it adheres to booking policies (lockout, deadline, fully staffed visibility at time of booking). Server is source of truth.

---

## Policies & Constraints

- Visibility

  - Only groups for active/current assignments are shown.
  - Group details are available only if the student is a member (403 otherwise).

- Time & timezone
  - All datetimes are ISO‑8601 with explicit timezone; client renders local time with badge.
- Freshness
  - Overview and details may use conditional GET (If‑Modified‑Since). A lightweight refetch pattern is sufficient; no 30s polling required here.

---

## End‑to‑End Journey

### 1) Navigate to My Groups

- From Student sidebar or dashboard, click “My Groups”.

### 2) Groups Overview (by Assignment, Active only)

- Shows the student's current group per assignment (active terms only). Each card shows:
  - Course/Assignment: courseCode, assignmentName, semester.
  - Group: groupName, memberCount, member initials/avatars (optional).
  - Primary action: “View Details”.
- Members are not shown on this overview; click “View Details” to view member information.
- Empty state: “You don’t have any active groups yet. When a course coordinator adds you to a group for an assignment, it will appear here.”

### 3) Group Details

- Header
  - Left: Group title (e.g., “Team Alpha”), courseCode + assignmentName, formedOn date (if available).
- Tabs/Sections (single page acceptable; tabs mirror prototype but are responsive)
  - Members
    - Table or cards: name, studentId, email, (You) badge for the current user. No member roles are displayed.
- Empty/edge states are clearly labeled (e.g., “No members found”).

---

## UX & Accessibility

- Keyboard navigation and ARIA roles for list items, tabs, and buttons; members table has table semantics.
- Clear breadcrumb.
- Empty states for no groups and no members (should not occur under normal data).

---

## Error Handling (User‑facing copy)

- NOT_FOUND — “We couldn’t find this group.”
- FORBIDDEN — “You don’t have access to this group.”
- NOT_ELIGIBLE — “This assignment doesn’t use group membership.”
- STALE_DATA — “This information changed. Please refresh.”

---

## Appendix — API alignment

Reference API document: “Student‑Groups‑API‑Contracts (Final)”

- Overview: `GET /api/students/{studentId}/groups?status=active&pageNum=&pageSize=&sort=`
- Details: `GET /api/students/{studentId}/groups/{groupId}`
- Wrapper: `{ success, code, data, message? }`
- Conditional read: request `If-Modified-Since`, response `Last-Modified`
- Error codes and copy: aligned with this section “Error Handling”

---

## State & Transitions (High level)

```
NoGroups ──→ GroupsOverview (Active)
              └─[Open details]→ GroupDetails
                                  └─ Members
```

---

## Telemetry & Success Metrics

- Coverage: % of students with ≥1 active group visible.
- Discoverability: Click‑through rate to Group Details.
- Latency: P95 < 300ms for overview fetch under warm cache.

---

## QA Acceptance Criteria (excerpt)

- Past/archived groups never appear on My Groups.
- Each group card shows the correct Course/Assignment and member count; clicking “View Details” opens the correct group.
- Group Details lists all members; current user is labeled (You).
