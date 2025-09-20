# Profile Page UI Design Document

## 1. Visual Direction
- **Tone**: Confident, academic, and approachable. Mirrors OAS dashboards with clean geometry and generous white space.
- **Layout Rhythm**: 24px outer gutters, 16px internal spacing, card-based composition with consistent elevation (`shadow-lg`) and rounded corners (`rounded-xl`).
- **Theme Support**: Full parity between light and dark themes; ensure automatic transition while preserving contrast ratios.

## 2. Page Structure
```
┌──────────────────────────────────────────────────────────────┐
│ Sticky Header (Avatar • Name • Role • Completeness • CTA)    │
├───────────────┬──────────────────────────────────────────────┤
│ Left Column   │ Right Column                                 │
│ (8 columns)   │ (4 columns)                                  │
│               │                                              │
│ Personal Info │ Role Widget Stack (contextual)               │
│ Institutional │ - Students: Next Session / Recent Sessions   │
│ Notifications │ - Examiners: Upcoming Allocation / Recent    │
│ Security      │ - Admins: Managed Courses / Task KPIs        │
│               │ - Super Admins: Approvals / System Metrics   │
└───────────────┴──────────────────────────────────────────────┘
```
- **Mobile**: Sections stack vertically; header condenses to two-line format (avatar + name on first line, role badge and completeness pill on second).
- **Tablet**: Retain two-column layout with 6/6 split and reduce card padding to 12px.

## 3. Branding Elements
- **Color Palette** (Tailwind tokens):
  - Primary Accent: `indigo-600` (light) / `indigo-400` (dark) for CTAs.
  - Surface: `white` on light, `slate-900` on dark with `slate-800` cards.
  - Neutral Text: `slate-900` / `slate-100`; secondary text `slate-600` / `slate-300`.
  - Status Chips: `emerald-500` (success), `amber-500` (warning), `rose-500` (alert).
- **Typography**: Inter family.
  - H1: 24px / 32px, weight 700.
  - Card Headings: 18px / 24px, weight 600.
  - Body: 14px / 20px, weight 400.
  - Metadata: 12px / 16px, uppercase tracking 2% for labels.
- **Iconography**: Lucide icon set with 20px default size, 16px stroke for smaller contexts.

## 4. Key Components

### 4.1 Profile Header
- **Content**: Avatar (48px, gradient border), name, role badge, university subtext, completeness meter (horizontal bar with percentage label), primary CTA linked to most relevant widget.
- **States**: Default, loading skeleton (avatar circle + shimmer bars), error fallback (initial letter avatar, message).
- **Interaction**: CTA routes to key action per role; hover states lighten accent color by 10%.

### 4.2 Information Cards
- **Structure**: Title row with optional description + action buttons (Edit, Save, Cancel).
- **Forms**: Inputs use Shadcn `Input`/`Select` components; align labels vertically with 8px gap.
- **Validation**: Inline helper text in `rose-500`; icons indicate success/error.
- **Feedback**: On save, show toast (top-right) and inline timestamp update.

### 4.3 Notification Preferences
- **Grid**: Two-column matrix—channels (Email/Desktop) vs domains (Bookings, Results, Examiner Updates, System Alerts).
- **Controls**: Shadcn `Switch` with accessible labels; include description text below each switch.
- **Group Actions**: `Reset to defaults` link (muted text) positioned bottom-right.

### 4.4 Security Section
- **Password Form**: Three fields (current, new, confirm) with inline strength meter (progress bar with `weak | fair | strong`).
- **Device List**: Placeholder card with empty state illustration (lock icon) and copy “Device management coming soon”.
- **Alert Banner**: If password older than 180 days, show warning banner (`amber-100` / `amber-900`).

### 4.5 Role-Specific Widgets (backend-aligned)
- **Students** (`student.nextSession`, `student.recentSessions`):
  - Next session card: headline uses `assignmentName`, subheadline `startAt` formatted `EEE d MMM HH:mm`, chips for venue/examiner.
  - Recent sessions list: timeline rows with status badges (Completed / Awaiting Results) derived in frontend.
  - Empty state: illustration + text “No upcoming bookings”/“No recent bookings”.
- **Examiners** (`examiner.nextSession`, `examiner.recentSessions`):
  - Upcoming allocation card with countdown timer, CTA `Go to Schedule`.
  - Recent sessions table: columns for student/group, assignment, time, add quick link to feedback.
- **Course Admins** (`admin.managedCourses`, `admin.pendingTasks`):
  - Managed courses grid: stacked cards showing subject code, course title, unstaffed badge, progress bar for assignment count.
  - Pending tasks KPIs: three stat tiles (unstaffed sessions, open sessions, assignments pending) with contextual icons.
- **Super Admins** (`superadmin.pendingApprovals`, `superadmin.systemMetrics`):
  - Approvals card with big number and CTA `Review Requests`.
  - System metrics card: trio of badges (active courses, new users 7d, total users) with sparkline option.
- **Empty States**: Use friendly illustration placeholders and descriptive copy; honour backend `description` value when payload empty.

## 5. Interaction & Motion
- **Hover/Focus**: Cards lift by translating 2px upward, drop shadow increases subtly; focus ring `ring-2 ring-indigo-400`.
- **Transitions**: 200ms ease-in-out for hover, 300ms for expanding edit state or widget accordion.
- **Loading**: Skeleton placeholders mimic layout; spinner for CTA while saving.
- **Errors**: Card border turns `rose-200` (light) / `rose-700` (dark) with icon and message.

## 6. Accessibility Guidelines
- Contrast ratios ≥ 4.5:1; verify key color pairs.
- Ensure switches announce state: “Email notifications on/off”.
- Provide skip link to jump to role widgets.
- Keyboard: `Tab` cycles through header > cards > widgets; `Esc` cancels edit mode.
- Widget tiles should expose aria descriptions summarising key metrics (e.g., `aria-label="Managed courses: 3 active, 2 unstaffed sessions"`).

## 7. Assets & Handoff
- **Design Tool**: Figma frame `OAS/Profile v2` with light/dark variants and component states.
- **Exportables**: SVG icons (Lucide default), PNG placeholders (1x,2x), JSON theme tokens shared via `design-tokens.json`.
- **Documentation**: Embed usage notes per component inside Figma, including widget key-to-component mapping; link to spec & implementation plan.

## 8. Responsive Snapshots (Textual)
- **Desktop (1280px)**: Two columns; widgets align vertically on right.
- **Tablet (834px)**: Cards 6/6; header condenses, CTA becomes icon + label button.
- **Mobile (390px)**: Single column; header becomes stacked, widgets convert to accordion (collapsed by default with chevron).

## 9. Open Design Questions
- Confirm whether we support user-uploaded avatars in this iteration.
- Determine animation duration tolerance for skeleton vs real data swap (target <400ms).
- Align iconography for pending tasks (checklist vs alert) with brand guidelines.
- Validate colour semantics for KPI tiles (warning vs informational) with stakeholders.
