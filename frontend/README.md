# OAS Frontend - Oral Assessment System

A modern web frontend built with Next.js 15 for managing oral assessments in educational institutions. This application provides complete user interfaces for students, examiners, course administrators, and super administrators, and integrates with a separate Spring Boot backend for all server-side functionality.

**Architecture Update**: The project has transitioned to a separated frontend/backend architecture:

- Frontend: Next.js 15 (UI, client-side logic only)
- Backend: Java Spring Boot (REST APIs, authentication, database operations)

Note: Some Next.js API routes remain temporarily for mock and development purposes. These will be removed as the frontend is fully integrated with the Spring Boot backend.

## 🚀 Quick Start

### 1. Start Database Service

```bash
# Navigate to database directory
cd ../database

# Start MySQL container
docker-compose up -d

# Verify database is running
docker-compose ps
```

### 2. Start Backend Service

```bash
# Navigate to backend directory
cd ../backend

# Start Spring Boot (development)
./mvnw spring-boot:run
# or
mvn spring-boot:run

# Backend will run at http://localhost:8081
```

### 3. Start Frontend Application

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Configure API base URL to point to Spring Boot
# Create .env.local and set:
# NEXT_PUBLIC_API_BASE_URL=http://172.22.80.212:8081
# (or http://localhost:8081 for local backend development)

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

Open http://localhost:3000 to view the frontend. Ensure the backend is running at the configured URL (http://172.22.80.212:8081 or http://localhost:8081).

### 4. Test Accounts (Backend Integration)

**Active Backend Accounts:**
| Role | Email | Password | Username |
| ------------ | ---------------------------- | ----------- | --------- |
| Course Admin | alice@student.unimelb.edu.au | password1 | alice |
| Student | bob@student.unimelb.edu.au | password2 | bob |
| Examiner | eve@student.unimelb.edu.au | password5 | eve |
| Super Admin | yunchen6@unimelb.edu.au | 123456 | Yun Chen |

## 🎯 Project Overview

### Technology Stack

- Frontend: Next.js 15 (App Router) with React 19, Tailwind CSS, Shadcn UI
- Language: JavaScript (JSX) - No TypeScript
- Client State: Zustand (auth, UI preferences)
- Server State: React Query (TanStack Query)
- Backend: Spring Boot (separate service) for REST APIs, authentication, and data access
- Database: MySQL 8.0 (Docker)
- Authentication: JWT-based via Spring Security; Next.js middleware used only for client-side route guards
- API Integration: Axios via centralized service layer, targeting Spring Boot base URL

### Design Principles

- **Role-based Architecture**: Separate interfaces for each user type
- **Atomic Design**: Component organization following atomic design principles
- **Desktop-first Design**: Desktop-optimized approach with mobile adaptation
- **Accessibility**: WCAG compliance with proper ARIA labels
- **Dark Mode**: Full theme support throughout the application
- **Progressive Enhancement**: Graceful degradation and error handling

## 🏗️ Architecture

### Frontend/Backend Separation

The system now uses a separated architecture:

- Frontend (this project): Next.js 15 for UI and client-side logic only
- Backend (separate repo/folder): Spring Boot for REST APIs, authentication, and database operations

**✅ Integration Complete**: Mock Next.js API routes have been replaced with direct Spring Boot integration. Legacy routes remain for backward compatibility but return deprecation messages.

### Sessions-Only Scheduling (Backend Pointers)

- Examiner self-assignment now targets session endpoints. See:
  - Docs/API/Examiner-Timeslot-Assignment-Contracts.md — “Sessions-Only Minimal Update” (endpoint mapping and required responses)
  - Docs/Design/Examiner-Timeslot-Assignment-Flow.md — “Sessions-Only Minimal Update (Examiner)”
- Student booking lists and books sessions directly. See:
  - Docs/API/Student-Booking-and-Sessions-API-Contracts(Final).md — “Sessions-Only Minimal Update” (endpoint mapping and examples)
  - Docs/Design/Student-Booking-Timeslot-User-Flow(Final).md — “Sessions-Only Minimal Update (Student)”

Backend teams: implement the listed session endpoints and availability semantics. Frontend already adapts to flat `sessions[]` and maps to existing UI structures with minimal changes.

### Onboarding Flow (Docs)

- Unified onboarding for Course Admins, Students, and Examiners begins from an email link and finishes at role dashboards.
- Start here for the full design and API contracts:
  - Docs/Design/Onboarding-Flow.md
  - Docs/API/Onboarding-Contracts.md

### Authentication Flow (✅ Fully Integrated)

**Current Implementation**: Direct Spring Boot integration with JWT tokens

**Backend Endpoints**:

- POST `/login` (email/password) → returns user data with accessToken/refreshToken
- POST `/logout` (userId/refreshToken) → invalidates session
- POST `/token/refresh` (refreshToken) → returns new access token
- POST `/auth/password-reset/request` (email) → sends verification code via email
- POST `/auth/password-reset/confirm` (email, code, newPassword) → resets password

**Frontend Flow**:

1. User submits credentials via login form
2. Frontend calls Spring Boot `/login` endpoint directly
3. Backend returns JWT tokens (accessToken, refreshToken) and user data
4. Tokens stored in Zustand state and secure cookies
5. API requests automatically include Bearer authorization headers
6. Role mapping converts backend roles (ROLE_ADMIN) to frontend roles (COURSE_ADMIN)
7. User redirected to appropriate dashboard based on role
8. Logout calls backend with userId and refreshToken to invalidate session

**Security Features**:

- JWT access tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Automatic token refresh on expiration
- Secure cookie storage for tokens
- Role-based route protection
- CORS support with credentials

### Database Architecture

- Service: MySQL 8.0 running in Docker container
- Schema: Complete relational database with 15+ tables (see Database docs)
- Test Data: Pre-seeded accounts and sample data
- Integration: Implemented via Spring Boot repositories/services (frontend accesses data only via backend APIs)

## 📁 Folder Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Public auth pages (no main layout)
│   │   ├── layout.jsx           # Minimal auth layout
│   │   ├── login/page.jsx       # Common login page
│   │   ├── onboarding/page.jsx  # Unified onboarding entry point
│   │   └── onboarding-test/page.jsx # Onboarding test scenarios
│   ├── admin/                   # Course Admin interface
│   │   ├── layout.jsx           # Admin layout with sidebar
│   │   ├── page.jsx             # Admin dashboard
│   │   ├── onboarding/          # Admin onboarding wizard
│   │   │   └── page.jsx         # 5-step activation flow
│   │   ├── courses/             # Course management
│   │   │   ├── page.jsx         # Course creation & management
│   │   │   └── [courseId]/      # Dynamic course routes
│   │   │       └── assignments/ # Course-specific assignments
│   │   │           ├── page.jsx # Assignment configuration
│   │   │           └── [assignmentId]/ # Assignment-specific routes
│   │   │               ├── schedule/page.jsx # Session configuration
│   │   │               └── timeslots/page.jsx # Timeslot management
│   │   ├── documentation/       # Documentation & FAQ
│   │   │   └── page.jsx         # Comprehensive help system
│   │   ├── users/               # User management
│   │   │   └── page.jsx         # Centralized members UI (Students | Examiners)
│   │   └── settings/            # Admin settings
│   ├── examiner/                # Examiner interface
│   │   ├── layout.jsx           # Examiner layout
│   │   ├── page.jsx             # Examiner dashboard
│   │   ├── schedule/            # Self-assignment and availability management
│   │   │   ├── page.jsx         # Schedule overview with multiple views
│   │   │   └── select/page.jsx  # Two-step timeslot selection wizard
│   │   ├── assessment/          # Assessment conduct (marking UI)
│   │   │   ├── page.jsx         # Session picker (choose a session to mark)
│   │   │   └── [sessionId]/page.jsx # Marking page for a specific session
│   │   └── comments/            # Comment templates
│   ├── student/                 # Student interface
│   │   ├── layout.jsx           # Student layout
│   │   ├── page.jsx             # Student dashboard
│   │   ├── assignments/         # View assignments
│   │   ├── booking/             # Time slot booking
│   │   ├── groups/              # Group membership management
│   │   │   ├── page.jsx         # Group overview with card/table views
│   │   │   └── [groupId]/page.jsx # Detailed group member information
│   │   └── results/             # Assessment results
│   ├── superadmin/              # Super Admin interface
│   │   ├── layout.jsx           # Super admin layout
│   │   ├── page.jsx             # System overview
│   │   ├── courses/page.jsx    # System-wide course management
│   │   ├── admins/page.jsx     # Course Admin user management
│   │   └── profile/page.jsx    # Super Admin profile
│   ├── globals.css              # Global styles
│   └── layout.js                # Root layout
│
├── components/                   # Reusable UI components
│   ├── ui/                      # Atomic UI primitives (Shadcn + Custom)
│   │   ├── button.jsx           # Button component
│   │   ├── input.jsx            # Input fields
│   │   ├── card.jsx             # Card containers
│   │   ├── dialog.jsx           # Modal dialogs
│   │   ├── label.jsx            # Form labels
│   │   ├── select.jsx           # Select dropdowns
│   │   ├── spinner.jsx          # Loading spinners
│   │   ├── table.jsx            # Data tables
│   │   ├── error-boundary.jsx   # Error boundary with fallbacks
│   │   ├── notification.jsx     # Toast notification system
│   │   └── api-status.jsx       # Development API status indicator
│   ├── onboarding/              # Unified onboarding components
│   │   ├── OnboardingLayout.jsx # Role-aware layout with progress
│   │   ├── OnboardingWizard.jsx # Main wizard orchestrator
│   │   └── steps/               # Onboarding step components
│   │       ├── OnboardingWelcome.jsx      # Welcome with context
│   │       ├── OnboardingBasicInfo.jsx    # Email/name verification
│   │       ├── OnboardingDepartment.jsx   # Department selection (admin)
│   │       ├── OnboardingPassword.jsx     # Password creation
│   │       └── OnboardingComplete.jsx     # Success confirmation
│   ├── layout/                  # Layout components
│   │   ├── AdminSidebar.jsx     # Course Admin navigation sidebar
│   │   ├── AdminTopNav.jsx      # Course Admin header navigation
│   │   ├── ExaminerSidebar.jsx  # Examiner navigation sidebar
│   │   ├── ExaminerTopNav.jsx   # Examiner header navigation
│   │   ├── StudentSidebar.jsx   # Student navigation sidebar
│   │   ├── StudentTopNav.jsx    # Student header navigation with profile dropdown
│   │   ├── SuperAdminSidebar.jsx # Super Admin navigation sidebar
│   │   └── SuperAdminTopNav.jsx # Super Admin header navigation
│   ├── admin/                   # Course Admin specific components
│   │   ├── onboarding/          # Onboarding wizard components
│   │   │   ├── OnboardingLayout.jsx        # Shared layout
│   │   │   ├── OnboardingWelcome.jsx       # Welcome step
│   │   │   ├── OnboardingBasicInfo.jsx     # User details
│   │   │   ├── OnboardingDepartment.jsx    # Department selection
│   │   │   ├── OnboardingCourses.jsx       # Course assignment
│   │   │   ├── OnboardingPassword.jsx      # Password creation
│   │   │   └── OnboardingComplete.jsx      # Success page
│   │   ├── assignments/         # Assignment management components
│   │   │   ├── AssignmentCreationModal.jsx # 3-step assignment creation wizard
│   │   │   ├── EditAssignmentModal.jsx     # Assignment editing interface
│   │   │   ├── AssignmentList.jsx          # Assignment table & card views
│   │   │   └── AssignmentOverviewStats.jsx # Assignment statistics cards
│   │   ├── courses/             # Course management components
│   │   │   ├── CourseCreationModal.jsx     # Course creation form
│   │   │   ├── EditCourseModal.jsx         # Course editing interface
│   │   │   ├── CourseOverviewStats.jsx     # Course statistics cards
│   │   │   └── CourseList.jsx              # Course table & card views
│   │   ├── users/               # User Management components
│   │   │   ├── ScopeSelector.jsx           # Course → Assignment scope picker
│   │   │   ├── UsersTable.jsx              # Role-aware table with selection/actions
│   │   │   ├── AddUserModal.jsx            # Add member (ROLE_STUDENT/ROLE_EXAMINER)
│   │   │   ├── UsersEmptyState.jsx         # Empty state for tabs
│   │   │   └── ConfirmDialog.jsx           # Polished delete confirmation
│   ├── examiner/                # Examiner specific components
│   │   ├── assessment/          # Marking UI building blocks
│   │   │   ├── HeaderStatusBar.jsx  # Timer + autosave + progress chips
│   │   │   ├── StudentSwitcher.jsx  # Per-student selector with completion badges
│   │   │   ├── SubmitDialog.jsx     # Submit confirmation dialog
│   │   │   ├── SessionInfo.jsx      # Session header info (assignment, time, venue)
│   │   │   ├── RubricTable.jsx      # Canvas-style rubric grid
│   │   │   └── TotalsPanel.jsx      # Scores summary card
│   │   ├── schedule/            # Course Admin timeslot management
│   │   │   ├── AddTimeSlotModal.jsx        # Comprehensive timeslot creation/editing modal
│   │   │   └── EditTimeSlotModal.jsx       # Wrapper for editing existing timeslots
│   │   └── dashboard/           # Course Admin dashboard components
│   │       ├── StatsCard.jsx    # Statistics cards
│   │       ├── AssignmentStatusTable.jsx # Assignment progress table
│   │       ├── QuickActions.jsx # Quick action buttons
│   │       ├── SimpleCalendar.jsx # Calendar view
│   │       └── ActionItems.jsx  # Priority task list
│   ├── superadmin/              # Super Admin specific components
│   │   └── dashboard/           # Super Admin dashboard components
│   │       ├── AdminManagementHub.jsx # Course Admin management
│   │       └── CourseOverviewTable.jsx # System-wide course view
│   ├── examiner/                # Examiner specific components
│   │   ├── assessment/          # Examiner marking UI components
│   │   │   ├── SessionInfo.jsx          # Session header: assignment, time, venue, participants
│   │   │   ├── RubricTable.jsx          # Canvas-style rubric (criteria x levels, comments)
│   │   │   └── TotalsPanel.jsx          # Group/individual totals and mixed weighting summary
│   │   └── schedule/            # Examiner timeslot self-assignment system
│   │       ├── AssessmentsToAssign.jsx      # Available assignments display with filtering
│   │       ├── AssignedSlots.jsx            # Current assignments with withdrawal functionality
│   │       ├── ExaminerCalendar.jsx         # Calendar view with booking status
│   │       ├── TimeslotList.jsx             # Interactive timeslot selection with validation
│   │       ├── WeekSchedule.jsx             # Week view with navigation and filtering
│   │       ├── DaySchedule.jsx              # Detailed day view with booking management
│   │       ├── ScheduleFilters.jsx          # Course, type, and search filtering system
│   │       ├── AssessmentSelectionStep.jsx  # Two-step assignment selection wizard
│   │       ├── TimeslotSelectionCalendar.jsx # Calendar interface for date browsing
│   │       ├── SelectionSummary.jsx         # Session allocation summary with validation
│   │       └── UpcomingAssessments.jsx      # Near-term assessment overview
│   ├── admin/results/         # Course Admin results moderation & release UI
│   │   ├── ResultsFilterBar.jsx      # Search/status/session filters for assessment list
│   │   ├── ScoreSummaryPanel.jsx     # Average vs final score with override/release actions
│   │   ├── ExaminerPanel.jsx         # Read-only examiner cards with rubric snapshots
│   │   ├── ReviewDialog.jsx          # Reason capture for reopening examiner markings
│   │   ├── FinalScoreEditor.jsx      # Manual final score override dialog
│   │   └── ReleaseDialog.jsx         # Release confirmation with notification toggle
│   └── student/                 # Student components
│       ├── dashboard/           # Student dashboard components
│       │   ├── MyGroups.jsx              # Group membership display with avatars
│       │   ├── RecentResults.jsx         # Recent assessment results with grades
│       │   ├── StudentCalendar.jsx       # Calendar with assessment dates
│       │   ├── StudentQuickActions.jsx   # Quick action buttons grid
│       │   ├── StudentStatsCards.jsx     # Statistics cards using shared UI
│       │   └── UpcomingAssessments.jsx   # Upcoming assessments list
│
├── services/                    # API integration layer
│   ├── apiClient.js             # Axios configuration (baseURL points to Spring Boot)
│   ├── authService.js           # Authentication APIs (temporary Next.js route → will call Spring Boot /login)
│   ├── onboardingService.js     # Onboarding APIs with mock support
│   ├── adminService.js          # Course Admin management (calls Spring Boot endpoints)
│   ├── courseService.js         # Course management operations
│   ├── assignmentService.js     # Assignment CRUD operations with mock data
│   ├── userService.js           # User management (assignment-centric members API)
│   ├── studentGroupsService.js  # Student groups and collaboration management
│   ├── examinerTimeslotService.js   # Examiner self-assignment and schedule management
│   ├── examinerAssessmentService.js # Examiner marking APIs (mock/real switch, contract-aligned)
│   ├── adminResultsService.js   # Course Admin results moderation/release (mock-first)
│   └── schedulingService.js     # Booking and scheduling
│
├── store/                       # State management
│   ├── authStore.js             # Authentication state (Zustand)
│   ├── uiStore.js               # UI preferences (Zustand)
│   └── scheduleFilterStore.js   # Schedule filtering state (Zustand)
│
├── hooks/                       # Custom React hooks
│   ├── useAuth.js               # Authentication helpers
│   ├── useDarkMode.js           # Theme management
│   ├── useExaminerAuth.js       # Examiner authentication and role validation
│   ├── useTimeslotAssignment.js # Timeslot assignment logic with conflict detection
│   └── admin/useAdminResults.js # Results list/detail queries + review/override/release mutations
│
├── lib/                         # Utilities and providers
│   ├── providers.jsx            # React Query provider
│   └── utils.js                 # Helper functions

├── hooks/                       # Custom hooks
│   └── examiner/assessment/     # Examiner marking hooks
│       ├── useMarkingSessionQuery.js   # Query + mutations for context/draft/submit
│       ├── useAssessmentDraft.js       # Local draft state (ratings/comments)
│       ├── useAssessmentValidation.js  # Missing/required counts by entity
│       └── useAutoSave.js              # Debounced draft autosave

├── utils/                       # Domain utilities
│   └── assessment.js            # buildAssessmentPayload and helpers
│
├── middleware.js                # Next.js middleware (auth)
├── tailwind.config.js           # Tailwind configuration
├── components.json              # Shadcn UI configuration
└── TESTING.md                   # Testing guide
```

## 🏗️ Architecture Design Rationale

### 1. **App Router Structure**

- **Route Groups**: `(auth)` group excludes main layout for login pages
- **Role-based Routes**: Clear separation with `/admin`, `/student`, `/examiner`, `/superadmin`
- **Nested Layouts**: Each role has its own layout with appropriate navigation
- **Dynamic Routes**: `[id]` patterns for resource-specific pages

### 2. **Component Architecture (Atomic Design)**

#### **Atoms** (`components/ui/`)

- Basic UI elements: buttons, inputs, cards
- Reusable across all interfaces
- Consistent styling with Tailwind CSS
- Shadcn UI foundation for accessibility

#### **Molecules** (`components/layout/`)

- Combined UI elements: navigation items, form groups
- Layout-specific components like sidebar and top navigation
- Theme management components

#### **Organisms** (`components/[role]/`)

- Complex, role-specific components
- Business logic integration
- Feature-complete sections (forms, calendars, wizards)

### 3. **State Management Strategy**

#### **Client State (Zustand)**

- **authStore.js**: User authentication, session management
- **uiStore.js**: Theme preferences, sidebar state, global UI flags
- Persistent storage with localStorage integration

#### **Server State (React Query)**

- All API data with automatic caching
- Background refetching and synchronization
- Optimistic updates for better UX
- Error handling and retry logic

#### **Local State (useState)**

- Component-specific temporary state
- Form inputs and validation
- Modal visibility and wizard steps

### 4. **Service Layer Design**

- **Centralized API Client**: Consistent request/response handling
- **Service Modules**: Domain-specific API functions
- **Mock Integration**: Seamless switching between mock and real APIs
- **Error Handling**: Global interceptors with user-friendly messages

## 🔐 Authentication & Security

### JWT Authentication Flow (Transition)

- Current (temporary): Login via Next.js API route, tokens managed in client state for development only
- Final: Login via Spring Boot `/login`, refresh via `/token/refresh`; tokens stored securely, Axios attaches Authorization headers
- Route Protection: Next.js middleware used for client-side guards only; backend enforces authorization
- Logout: Clear client state and invalidate tokens via backend when implemented

### Role-based Access Control

```jsx
// Middleware checks user role and redirects appropriately
const roleRoutes = {
  STUDENT: "/student",
  EXAMINER: "/examiner",
  COURSE_ADMIN: "/admin",
  SUPER_ADMIN: "/superadmin",
};
```

## 🔗 Implementation Status

### Current State

- Frontend: Next.js UI, role-based dashboards, service layer using Axios
- Authentication: Temporary Next.js API route for login during development
- Backend: Spring Boot service with /login and /token/refresh available; additional endpoints under active development
- Database: MySQL running via Docker; accessed by Spring Boot only

### Integration Status — ✅ COMPLETED

**✅ Authentication Integration Complete:**

- Spring Boot backend fully integrated for login/logout
- JWT token management with access and refresh tokens
- Role mapping between backend (ROLE\_\*) and frontend roles
- User data display from backend in all dashboards
- Secure token storage and automatic header attachment
- Test accounts updated with real backend credentials

**✅ Onboarding System Integration Complete:**

- Full Spring Boot integration for onboarding token verification (`GET /onboarding/verify`)
- Complete user registration flow with Spring Boot (`POST /onboarding/register`)
- Role-based onboarding wizard (Course Admin, Student, Examiner)
- Token-based email invitation system integration
- Automatic login after successful registration
- Role-based redirection after onboarding completion
- Comprehensive error handling for expired/invalid tokens
- Department selection for Course Admin onboarding

**✅ User Management UI:**

- Admin User Management implemented under `/admin/users`
- Assignment-centric member APIs integrated at the service layer
- Polished delete confirmations and UX refinements

**✅ Password Reset System Integration Complete:**

- Complete password reset flow using email verification codes
- Spring Boot backend integration with `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm`
- Two-step UI flow: forgot password (`/forgot-password`) → reset password (`/reset-password`)
- Security features: account enumeration prevention, rate limiting (60s cooldown), attempt tracking
- Comprehensive error handling for validation errors (code 4006, invalid codes, expired codes, weak passwords)
- Real-time password strength validation with visual feedback
- Session management with automatic cleanup on successful reset
- User-friendly error messages without technical popups
- React Error Boundary implementation for graceful error handling

**🔄 Next Integration Priorities:**

- Course and assignment management API endpoints
- Student enrollment and booking system
- Examiner scheduling and assessment interfaces
- Results and reporting system integration

### Environment Configuration

**Frontend `.env.local` (✅ Configured):**

```
# Active backend server
NEXT_PUBLIC_API_BASE_URL=http://172.22.80.212:8081

# For local development
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8081
```

**Backend Configuration:**

- Server runs on port 8081
- Environment variables defined in backend application.yml
- Database and JWT configuration managed by Spring Boot profiles

#### **1. API Design Consistency**

- **RESTful Endpoints**: Following REST conventions for all admin management operations
- **Consistent Response Format**: Standardized `{ success: boolean, data: any, message: string }` structure
- **Error Handling**: Proper HTTP status codes and error message formatting
- **Request Validation**: Frontend validation that mirrors expected backend validation

#### **2. Security Best Practices**

- **Email Domain Validation**: University domain enforcement (`@stduent.unimelb.edu.au`)
- **CSRF Protection**: Ready for Spring Security CSRF tokens
- **JWT Integration**: Authentication headers automatically attached
- **Input Sanitization**: XSS prevention in form inputs

#### **3. Performance Optimization**

- **Lazy Loading**: Components load only when needed
- **Caching Strategy**: React Query ready for backend data caching
- **Optimistic Updates**: UI updates before backend confirmation
- **Debounced Search**: Search input debouncing to reduce API calls

#### **4. Error Handling & UX**

- **Error Boundaries**: React error boundaries with graceful fallbacks and retry mechanisms
- **Global Notification System**: Professional toast notifications with type-specific styling and actions
- **API Status Tracking**: Development-mode indicator showing mock vs real API status
- **Graceful Degradation**: Fallbacks for network issues and component failures
- **Loading States**: Skeleton loading and spinners throughout the application
- **Retry Logic**: Automatic retry for failed requests with exponential backoff

1. Switch frontend services to Spring Boot APIs and verify end-to-end auth and RBAC flows
2. Remove temporary Next.js API routes after backend parity
3. Configure CORS and security policies between frontend (localhost:3000) and backend (localhost:8081)
4. Set up deployment pipelines for separate frontend and backend services

- Course Admin interface: 90% complete (results moderation + release UI live; reports and Canvas export pending)
- Super Admin interface: 95% complete (fully functional)
- Student interface: 90% complete (booking and results implemented, missing notification preferences)
- Examiner interface: 85% complete (dashboard, scheduling, marking UI with mocks; backend integration pending)
- Backend APIs: Spring Boot auth endpoints available; additional domain APIs in progress
- Database: Schema complete, integration pending

**🏗️ Frontend/Backend Separation**

- Frontend: Next.js 15 used strictly for UI and client-side logic
- Backend: Spring Boot provides REST APIs (authentication, admin management, courses, etc.)
- Communication: Axios service layer targets Spring Boot base URL (configurable via NEXT_PUBLIC_API_BASE_URL)

**🔌 API Endpoints (Backend)**

- POST `/login` - User authentication, returns access/refresh tokens
- POST `/token/refresh` - Refresh access token
- Additional domain endpoints under `/api/...` will be documented in backend

**💾 Database Infrastructure**

- MySQL 8.0 Docker container setup
- Complete relational schema (15+ tables)
- Test data seeding scripts
- Backend-only DB access; frontend accesses data via REST APIs

## Frontend Implementation Status vs PRD Requirements

### Executive Summary

**What's Working:**
- ✅ All four user roles have complete dashboards and navigation
- ✅ Authentication system fully integrated with Spring Boot backend  
- ✅ Course and assignment creation/management interfaces complete
- ✅ Rubric builder with customizable criteria and performance levels
- ✅ Student booking workflow with calendar-based slot selection
- ✅ Examiner self-assignment to timeslots with conflict detection
- ✅ Student groups display and collaboration features
- ✅ Student results viewing with detailed rubric breakdown
- ✅ Course Admin results moderation & release flow (mock data aligned with API contract)
- ✅ CSV import for student/group data
- ✅ Course Admin and Super Admin management systems

**Critical PRD Gaps:**
- ❌ **Examiner Marking Interface**: No actual assessment execution interface
- ❌ **Reporting System**: Three required reports not implemented
- ❌ **Email Notifications**: System specified in PRD not functional
- 🚧 **Results Release Control**: Course Admin moderation & release UI implemented (mock-driven); backend integration pending
- ❌ **Mark Aggregation**: Multiple examiner score combination not implemented
- ❌ **Canvas Export**: Results export to LMS not complete

### Detailed Implementation Status

The following reflects the current state of the frontend implementation against PRD requirements. Backend capabilities are provided by a separate Spring Boot service. Status levels:

- ✅ Complete (UI implemented + Spring Boot backend integration working)
- 🚧 Frontend Ready (UI built, awaiting Spring Boot API integration)
- ⏳ Partial (some UI components missing or incomplete)
- ❌ Not Started (no frontend implementation)

### User Account Management & Authentication — ✅ Complete (backend integrated)

- Current: Full Spring Boot integration with JWT authentication; direct backend API calls for login/logout; role mapping and user data display from backend.
- Implementation: Integrated with Spring Boot POST `/login`, POST `/logout`, and POST `/token/refresh`; server-side authorization with JWT tokens.
- User can: Login with backend test accounts (alice, bob, eve, Yun Chen); automatic role-based redirection; secure logout with token invalidation; view actual user details in dashboards.

### User Onboarding System — ✅ Complete (backend integrated)

- Current: Complete unified onboarding UI for all three roles (Course Admin, Student, Examiner); fully integrated with Spring Boot backend; role-aware theming and flows.
- Implementation: Token-based invitation verification via Spring Boot `/onboarding/verify`; complete registration via `/onboarding/register`; 4-step flow for admins (with department), 3-step for students/examiners; course/assignment context display.
- User can: Complete full end-to-end onboarding from email invitation links; register new accounts with Spring Boot backend; auto-login after successful registration; role-based redirection to appropriate dashboards.
- Integration: Fully connected to Spring Boot endpoints with comprehensive error handling and role mapping.

### Course & Assignment Configuration — 🚧 Frontend Ready (mock)

- Current: Course creation/editing UI, dashboards, assignment configuration pages, and assignment creation wizard implemented; services use mock data.
- Target: Wire course and assignment services to Spring Boot endpoints.
- User can: Create/edit courses and assignments in the UI; data persists only in mock layer.

### Rubric and Feedback Customization — ✅ Complete (with mock services)

- Current: Full rubric builder UI with comprehensive configuration capabilities.
- Implementation: Dedicated rubric configuration page at `/admin/courses/[courseId]/assignments/[assignmentId]/rubric`; criterion management with drag-and-drop; customizable performance levels with variable count per criterion; predefined comment management; rubric preview functionality.
- Components: RubricCriterion.jsx, PerformanceLevel.jsx, CommentManager.jsx, RubricPreview.jsx.
- User can: Create and edit rubric criteria; define custom performance levels with point values; manage predefined feedback comments; preview complete rubric structure; save and update rubric configurations.

### Student Groups System — ✅ Complete (with mock services)

- Current: Complete student groups interface with group overview and detailed member information; comprehensive mock API layer.
- Implementation: Assignment-level group membership display, group overview with card/table views, detailed member information with contact details, responsive design.
- User can: View all active group memberships; switch between card and table view; access detailed group information; see collaboration guidelines.
- Features: Professional gradient-themed interface; avatar generation; search and filtering; responsive mobile-first design.
- API Integration: Following API specification with mock service; realistic delays and error scenarios.

### Student/Group Data Import — ✅ Complete (with mock services)

- Current: CSV upload UI fully integrated in assignment workflows with preview functionality.
- Implementation: File upload interface in assignment configuration; CSV preview before import; validation and error handling.
- Backend: Spring Boot /api/csv/preview and /api/csv/import endpoints available.
- User can: Upload student/group CSV files; preview data before import; see validation errors; confirm import.

### Student Slot Booking System — ✅ Complete (with mock services)

- Current: Full booking workflow implemented with calendar-based slot selection and confirmation.
- Implementation: Multi-step booking wizard at `/student/booking/[assignmentId]`; calendar view with available dates; session selection with venue and examiner info; booking confirmation page; group booking support; reschedule capability.
- Components: AssignmentsAvailable.jsx, MyBookings.jsx, StudentCalendar.jsx; integrated with studentBookingReal.js service.
- User can: View available assignments for booking; select dates from calendar; choose specific sessions; confirm bookings; view and manage existing bookings; reschedule if allowed.

### Scheduling & Time Slot Management — ✅ Complete (with mock services)

- Current: Complete scheduling and timeslot management for both Course Admin configuration and Examiner self-assignment; comprehensive mock API layer with realistic test data.
- Implementation: Three-step session configuration wizard for Course Admin; calendar-based timeslot display and management; batch operations (duplicate, delete, notify); examiner self-assignment with conflict detection; withdrawal functionality when no students booked.
- User can: Configure assessment session parameters; create and manage timeslots with venues; assign examiners to slots; view calendar-based schedules; perform bulk operations; track booking status.

### Notifications System — ⏳ Partial (UI notifications only)

- Current: In-app toast notifications via notification.jsx component; email notifications mocked in services.
- Implementation: Toast notification system with success/error/info/warning types; useNotification hook for global notification management.
- Backend: Email notification endpoints to be implemented in Spring Boot backend.
- User can: See in-app notifications for actions; email notifications not yet functional.
- Missing: Actual email sending for booking confirmations, reminders, user invitations, and result releases.

### Examiner Self-Assignment — ✅ Complete (with mock services)

- Current: Complete examiner timeslot self-assignment system with withdrawal functionality; comprehensive mock API layer with realistic test data.
- Implementation: Two-step selection wizard (assignment selection → timeslot selection), calendar-based timeslot browsing, session limit management, conflict detection, and withdrawal functionality following API contracts.
- User can: Browse available assignments needing examiners; select timeslots via calendar interface; view assigned sessions in schedule; withdraw from slots when no students are booked; see real-time booking status and eligibility.
- Features: `useExaminerAuth` and `useTimeslotAssignment` custom hooks; optimized polling (60s-3min intervals); comprehensive error handling; visual booking status indicators; withdrawal only when `bookingCount === 0`.

### Course Admin Timeslot Configuration — ✅ Complete (with mock services)

- Current: Complete course admin timeslot management system with calendar-based interface and bulk operations; comprehensive mock API layer with realistic test data.
- Implementation: Three-step configuration wizard (session parameters → timeslot creation → examiner assignment), calendar-based timeslot display, batch operations (duplicate, delete, notify), and real-time status tracking.
- User can: Configure assessment session parameters (duration, gap time, required examiners); create and manage timeslots with venue assignment; view calendar-based schedule with staffing status; perform bulk operations on selected timeslots; track examiner assignments and booking status.
- Features: Dynamic end time calculation, status indicators (full/partial/empty staffing), modal-based timeslot creation/editing, comprehensive error handling, and professional UX with loading states.

### Examiner Marking — ✅ Complete (with mock services)

- Route: `/examiner/assessment` (session picker → marking UI)
- Features: Canvas-style rubric table (criteria rows × level columns), per-criterion comments with predefined “quick comments”, numeric points with level-bound validation, auto-save to draft, submit with confirmation lock, mixed assignment toggle (Group/Individual), per-student selector with live “x/y complete”, compact per-student chips, totals panel (group, individual, final for mixed), and read-only lock for submitted sessions.
- Mock data: Three scenarios aligned to API contract
  - Mixed (101): session 90011 (unmarked)
  - Individual (102): session 90012 (draft resumes)
  - Group (103): session 90013 (submitted, locked)
- Services: `services/examinerAssessmentService.js` (contract-aligned endpoints, `{ success, code, data }` wrapper), toggled by `NEXT_PUBLIC_USE_MOCKS=true`
- Components: `components/examiner/assessment/HeaderStatusBar.jsx`, `StudentSwitcher.jsx`, `SubmitDialog.jsx`, `SessionInfo.jsx`, `RubricTable.jsx`, `TotalsPanel.jsx`
- Status: UI complete with mocks; Spring Boot integration pending

### Mark Calculation & Aggregation — ⏳ Partial (display only)

- Current: Student results display with rubric breakdown implemented; aggregation calculation not implemented.
- Implementation: Results pages show detailed rubric scores, examiner feedback, and performance levels; Canvas-style rubric display components.
- User can: View detailed assessment results with rubric breakdown; see examiner feedback and comments.
- Missing: Mark aggregation configuration, multiple examiner score combination, calculation methods selection.

### Reporting and Analytics — ❌ Not Started

- Current: No dedicated reports UI (scheduling overview report, mark results report, examiner trends report).
- Implementation: Dashboard statistics cards exist but no formal reporting pages as specified in PRD.
- Target: Build three key reports specified in PRD - Scheduling Overview, Mark Results & Aggregation, Examiner Trends.
- User can: View basic statistics on dashboards only; formal reports not available yet.

### Results Release Control — 🚧 Frontend Ready (mock-backed)

- Current: Course Admin can review examiner submissions, set manual overrides, request rework, and release/re-release results (mock data aligned with API contract).
- Implementation: Results list with filters, detail page with rubric snapshots, manual override editor, review dialog, and release confirmation (with notify toggle).
- Target: Wire up Spring Boot endpoints and add reporting/export workflows; maintain optimistic updates and notifications.
- User can: Moderate and release results when using `NEXT_PUBLIC_USE_MOCK_API=true`; backend integration required for production.

### Canvas LMS Integration — ⏳ Partial (CSV import ready)

- Current: CSV student/group data import UI implemented; export functionality service exists but UI not complete.
- Implementation: Assignment service supports CSV upload for student data; exportResultsService.js exists for grade export.
- User can: Upload student/group CSV files in assignment configuration; preview CSV data before import.
- Missing: UI for exporting results to Canvas-compatible CSV format; full integration workflow.

**🎯 Enhanced Course Admin Dashboard**

- **Professional Layout**: Full sidebar navigation with dark mode support and responsive design
- **Actionable Stats Cards**: Active assignments, pending tasks, participants, and examiners with direct action buttons
- **Assignment Status Overview**: Table showing workflow progress (Setup → Scheduling → Live → Results) with next action buttons
- **Interactive Calendar**: Simple month view displaying assignment dates with color-coded event types
- **Quick Actions Grid**: 6-button grid for common admin tasks (New Assignment, Import Students, Invite Examiner, Export Results, View Reports, Settings)
- **Action Items Panel**: Priority-based task list with urgent/medium/low indicators and direct action links
- **Integrated Navigation**: Breadcrumb system and contextual page titles matching prototype design
- **Font Awesome Integration**: Complete icon system for visual consistency
- **Mock Data System**: Realistic placeholder content for development and testing

**🔐 Super Admin Management System**

- **Enhanced Dashboard**: Professional orange-themed interface with system-wide oversight capabilities
- **Course Admin Invitation Workflow**: Streamlined invitation process with automatic email sending to new course administrators
- **Pending Invitations Tracking**: Visual status tracking for invited admins (invitation sent vs. registered)
- **System-wide Course Overview**: Comprehensive read-only table with advanced filtering, search, and export capabilities
- **Administrative Controls**: Direct invitation management with resend functionality for unregistered admins
- **Tab-based Navigation**: Clean organization between overview, admin management, and course browsing
- **Professional Branding**: Orange/red gradient color scheme emphasizing elevated administrative authority
- **Interactive Elements**: Hover effects, micro-animations, and loading states throughout
- **Dark Mode Support**: Complete theme switching compatible with course admin interface
- **Desktop-first Design**: Optimized for desktop administrators (no mobile responsive requirements)

**🎯 Enhanced Examiner Dashboard**

- **Professional Layout**: Complete examiner interface with dedicated sidebar navigation, top navigation bar, and responsive design
- **Welcome Animation**: Engaging welcome overlay with examiner-specific branding and smooth animations
- **Comprehensive Stats Cards**: Key metrics display including today's assessments, pending feedback, completed assessments, and students assessed
- **Today's Schedule**: Detailed view of current day's assessments with time, location, participants, and action buttons
- **Pending Feedback Management**: Prioritized list of assessments requiring feedback with urgency indicators and direct action links
- **Weekly Calendar Overview**: Compact calendar showing week's assessment schedule with color-coded status indicators
- **Comment Library System**: Organized feedback template management with categories, usage tracking, and CRUD operations
- **Navigation Structure**: Hierarchical menu with main functions (Dashboard, Schedule, Assessment, Results), tools (Comment Library), and help sections
- **Real-time Notifications**: Notification system with assessment updates, schedule changes, and urgent feedback reminders
- **Search Functionality**: Global search for assignments, students, and assessment-related content
- **Dark Mode Support**: Complete theme switching with examiner-specific color schemes and visual consistency
- **Placeholder Pages**: Professional placeholder implementations for Schedule, Assessment, Results, Documentation, and Profile pages
- **Mock Data Integration**: Realistic assessment data, feedback items, and calendar events for development and testing
- **Responsive Design**: Mobile-first approach with collapsible sidebar and touch-friendly interactions
- **Accessibility Features**: Proper ARIA labels, keyboard navigation, and screen reader compatibility

**🎯 Enhanced Student Dashboard**

- **Professional Layout**: Complete student interface with dedicated sidebar navigation, top navigation bar with profile dropdown, and responsive design
- **Welcome Animation**: Engaging welcome overlay with student-specific branding using shared WelcomeAnimation component
- **Comprehensive Stats Cards**: Key metrics display using shared StatsCard component including total assessments, upcoming assessments, completed assessments, and group memberships
- **Upcoming Assessments Management**: Detailed view of scheduled assessments with booking status, deadlines, and quick action buttons for booking and viewing details
- **Recent Results Display**: Assessment results with grades, feedback links, and performance trends using consistent card patterns
- **Group Collaboration Interface**: Group membership management with member avatars, group assessment coordination, and team communication features
- **Assessment Calendar**: Interactive calendar showing assessment dates, deadlines, and booking status with month navigation
- **Quick Actions Grid**: Fast access to common student tasks including booking assessments, viewing results, accessing help, and managing groups
- **Navigation Structure**: Hierarchical menu with main functions (Dashboard, Assignments, Booking, Results, Groups), tools (Calendar, Help), and settings
- **Profile Management**: Top navigation dropdown with profile access and logout functionality matching examiner/admin patterns
- **Dynamic Semester Display**: Automatic semester calculation (Feb-July: Semester 1, Aug-Nov: Semester 2, Dec-Jan: Summer Term) in header info box
- **Consistent Design System**: Utilizes shared UI components (StatsCard, WelcomeAnimation) for consistency across all user roles
- **Component Reuse**: Maximum code reuse through shared dashboard patterns while maintaining student-specific functionality
- **Dark Mode Support**: Complete theme switching with student-specific color schemes and visual consistency
- **Responsive Design**: Mobile-first approach with adaptive layouts for all screen sizes
- **Animation System**: Smooth transitions and loading animations using shared animation classes
- **Mock Data Integration**: Realistic assessment data, group information, and calendar events for development and testing

**🎯 Course Admin Management Interface**

- **Dedicated Admin Management Page** (`/superadmin/admins`): Full-featured interface for Course Admin lifecycle management
- **Enhanced Invitation Workflow**:
  - University email validation (@student.unimelb.edu.au domain checking)
  - Duplicate email prevention with real-time validation
  - Form validation with inline error feedback
  - Professional invitation email templates
- **7-Day Invitation Expiry System**:
  - Automatic expiry tracking with visual countdown
  - Expired invitation cleanup automation
  - Resend functionality for expired invitations
- **Comprehensive Admin Tracking**:
  - Real-time status monitoring (Invited → Registered → Active → Inactive)
  - Activity tracking (last login, course counts, student management stats)
  - Visual status indicators with color-coded badges
- **Advanced Management Actions**:
  - Resend invitations with API integration
  - Admin access revocation capabilities
  - Detailed admin profile viewing
  - Search and filtering across all admin data
- **Integration with Existing Onboarding**: Invited Course Admins use the same 5-step onboarding wizard
- **Professional UX**: Loading states, success/error notifications, form validation, and accessibility compliance

**📱 Role-based Dashboards**

- Course Admin dashboard with complete workflow management
- Student dashboard with assignment access
- Examiner dashboard with scheduling tools
- Super Admin dashboard with system overview
- Consistent navigation and logout functionality

**🏗️ Component Architecture**

- **Atomic Design Pattern**: UI primitives (button, input, card) → Layout components (sidebars, nav) → Feature components (dashboards, forms)
- **Role-specific Libraries**: Separate component hierarchies for Course Admin, Super Admin, and Examiner interfaces
- **Layout Components**: AdminSidebar/TopNav, SuperAdminSidebar/TopNav, ExaminerSidebar/TopNav, and StudentSidebar/TopNav with consistent branding
- **Dashboard Systems**: Comprehensive component libraries for admin, examiner, and student dashboards
  - **Course Admin**: StatsCard, AssignmentStatusTable, QuickActions, SimpleCalendar, ActionItems
  - **Super Admin**: AdminManagementHub, CourseOverviewTable with advanced filtering
  - **Examiner**: TodaySchedule, WeeklyOverview, PendingFeedback, StatsCard
  - **Student**: StudentStatsCards (using shared StatsCard), UpcomingAssessments, RecentResults, MyGroups, StudentCalendar, StudentQuickActions
- **Course Management System**: Complete course lifecycle components
  - **CourseCreationModal**: Multi-section form with progress tracking and validation
  - **EditCourseModal**: Full-featured editing with unsaved changes detection
  - **CourseList**: Dual view (table/card) with advanced filtering and animations
  - **CourseOverviewStats**: Statistical dashboard with animated counters
- **Timeslot Management System**: Complete examiner self-assignment and course admin configuration
  - **Examiner Components**:
    - **AssessmentsToAssign**: Available assignments display with filtering and urgency indicators
    - **AssignedSlots**: Current assignments management with withdrawal functionality
    - **ExaminerCalendar**: Calendar view with booking status and real-time updates
    - **TimeslotList**: Interactive timeslot selection with conflict detection and validation
    - **WeekSchedule**: Week view with navigation and filtering capabilities
    - **DaySchedule**: Detailed day view with booking status and withdrawal actions
    - **ScheduleFilters**: Course, assessment type, and search filtering system
    - **AssessmentSelectionStep**: Two-step assignment selection wizard
    - **TimeslotSelectionCalendar**: Calendar interface for date-based timeslot browsing
    - **SelectionSummary**: Session allocation summary with validation and management
    - **UpcomingAssessments**: Near-term assessment overview with action buttons
  - **Course Admin Components**:
    - **AddTimeSlotModal**: Comprehensive timeslot creation/editing with venue and examiner assignment
    - **EditTimeSlotModal**: Wrapper for editing existing timeslots with validation
    - Calendar-based timeslot management interface with status visualization
    - Batch operations system (duplicate, delete, notify examiners)
    - Real-time staffing status tracking and examiner workload management
- **Custom Hooks**: Specialized hooks for complex state management
  - **useExaminerAuth**: Examiner authentication and role validation
  - **useTimeslotAssignment**: Timeslot assignment logic with conflict detection
  - **useScheduleFilterStore**: Global filter state management (Zustand)
- **Documentation System**: Comprehensive FAQ and help system with search and categorization
- **UI Foundation**: Complete Shadcn UI integration with custom styling and dark mode support

#### 🛠️ **Technical Infrastructure**

**State Management**

- Zustand stores for authentication and UI state
- React Query integration ready for server state
- Persistent storage with localStorage

**API Integration**

- Centralized Axios client with interceptors
- Service layer with domain-specific modules
  - **authService**: Authentication and session management
  - **onboardingService**: User onboarding with token verification and registration
  - **adminService**: Super Admin and Course Admin operations
  - **courseService**: Course creation, editing, and management
  - **userService**: User management and role assignment
  - **assignmentService**: Assignment configuration and workflows
  - **studentGroupsService**: Student groups and collaboration management
  - **examinerTimeslotService**: Examiner self-assignment and schedule management
    - **getAvailableAssignments**: Fetch assignments needing examiner allocation
    - **getExaminerSchedule**: Retrieve examiner's current schedule with filtering
    - **getAvailableTimeslots**: Get selectable timeslots for assignment with conflict detection
    - **assignExaminerToTimeslots**: Bulk timeslot assignment with validation
    - **withdrawFromTimeslot**: Examiner withdrawal with booking status checking
    - Comprehensive mock data with realistic scheduling scenarios and booking states
- **Mock API system for development** with realistic delays and validation scenarios
- Error handling and retry logic with user-friendly messages
- **Email notifications**: Currently mocked, will be implemented in Java backend

#### Examiner Marking Service (Mock/Real Switch)

- File: `services/examinerAssessmentService.js`
- Toggle: `NEXT_PUBLIC_USE_MOCKS=true` (dev-only)
- Contract alignment: Implements endpoints in `Docs/API/Examiner-Assessment-API-Contracts.md`
- Mock scenarios returned:
  - Mixed assignment (101) → session 90011 (unmarked)
  - Individual assignment (102) → session 90012 (draft)
  - Group assignment (103) → session 90013 (submitted)

**Development Tools**

- ESLint configuration for code quality
- Environment variable management
- Development/production mode switching
- Comprehensive testing documentation

**✅ Completed**

- **Authentication System**: JWT-based auth with separate login portals and role-based routing
- **Unified Onboarding System**: Complete onboarding flows for all three roles with token verification, role-aware theming, and course/assignment context display
- **API Infrastructure**: Authentication, admin management, and partial course management endpoints
- **Course Admin Interface**: Complete dashboard, course management, assignment configuration, and rubric builder
- **Super Admin Interface**: Full admin management system with invitation workflow and course oversight
- **Student Dashboard Interface**: Complete dashboard with stats cards, upcoming assessments, recent results, group management, calendar, and quick actions using shared UI components
- **Student Groups System**: Complete groups interface with overview and detailed member information, dual view modes, search functionality, and comprehensive mock API integration
- **Examiner Interface**: Complete dashboard and timeslot self-assignment system with comprehensive scheduling management
- **Component Architecture**: Atomic design with role-specific libraries, shared UI components, and Shadcn UI integration
- **Service Layer**: Complete API integration with mock data and error handling
- **Database Setup**: MySQL 8.0 with complete schema and test data (ready for integration)
- **Professional UI/UX**: Dark mode, animations, micro-interactions, and responsive design

**🚧 Critical Gaps (Against PRD Requirements)**

- **Notifications System**: Email notification system not implemented (booking confirmations, reminders, user invitations)
- **Examiner Marking Integration**: Backend integration for examiner marking pending (UI complete with mocks)
- **Reporting System**: Three required reports not implemented (Scheduling Overview, Mark Results & Aggregation, Examiner Trends)
- **Results Release Control**: Course Admin control over result release timing not implemented
- **Mark Aggregation**: Configuration for aggregation methods (average/max/min) not implemented
- **Mark Aggregation Across Examiners**: Aggregation methods and multi-examiner combination not implemented
- **Security & Compliance**: Audit logging and WCAG accessibility compliance not fully verified
- **Canvas Export**: Results export to Canvas-compatible CSV format UI not complete

## 📋 Changelog

### ✅ **Latest Refactoring (2024-12-28)**

**🎯 Course Admin Timeslot System Architectural Refactoring**

- **Complete architectural overhaul** of the Course Admin timeslot management system following SOLID principles
- **Replaced monolithic components** with modular, reusable components following the Single Responsibility Principle
- **Migrated from local state to server state** using React Query hooks for all data operations
- **Added comprehensive JSDoc typedefs** for all data models (TimeSlot, SessionConfig, Examiner, etc.)
- **Fixed query key structures** to follow specification pattern: `['assignment', assignmentId, 'resource']`
- **Integrated notification system** replacing all browser `alert()` calls with professional toast notifications
- **Created modular component architecture**:
  - `SessionConfigStep.jsx` - Step 1 of wizard using `useSessionConfig` hook
  - `TimeSlotForm.jsx` - Form component with session config injection
  - `TimeSlotList.jsx` - List component with batch operations
  - `ExaminerLimitsStep.jsx` - Step 3 with capacity validation
  - `CalendarMonth.jsx` - Calendar component using `useCalendar` hook
  - `TimeSlotCard.jsx` - Individual timeslot display component
  - `BulkActionsBar.jsx` - Bulk operations interface
- **Implemented service factory pattern** (`lib/services/serviceFactory.js`) for seamless mock/real API switching
- **Added utility modules**: `timeMath.js`, `validation.js`, `notifications.js`, `mappers.js`
- **Created comprehensive React Query hooks**:
  - `useSessionConfig.js` - Session configuration management
  - `useTimeSlots.js` - Timeslot CRUD operations with batch processing
  - `useExaminerLimits.js` - Examiner capacity management
  - `useScheduleRelease.js` - Schedule release control
  - `useCalendar.js` - Calendar state management
- **Fixed session configuration injection** in `AddTimeSlotModal` to eliminate hard-coded values
- **Maintained UI consistency** while completely overhauling underlying data architecture
- **Added type safety** with comprehensive JSDoc documentation throughout
- **Files refactored**: 
  - `app/admin/courses/[courseId]/assignments/[assignmentId]/schedule/page.jsx` (750+ lines → modular composition)
  - `app/admin/courses/[courseId]/assignments/[assignmentId]/timeslots/page.jsx` (complete server state migration)
  - `components/admin/schedule/` (complete component decomposition)
  - `lib/hooks/` (comprehensive hook library)
  - `lib/services/` (service layer with factory pattern)
  - `lib/types/timeslot.js` (JSDoc type definitions)

**📋 Next Phase Priorities (Based on PRD Gap Analysis)**

1. **Examiner Marking Integration**: Wire marking UI to Spring Boot endpoints per `Docs/API/Examiner-Assessment-API-Contracts.md`
2. **Reporting System**: Implement Scheduling Overview, Mark Results & Aggregation, and Examiner Trends with export
3. **Results Release Control**: Course Admin review/approval and release workflow with student notifications
4. **Email Notifications**: Spring Boot email service for booking confirmations, reminders, and releases
5. **Mark Aggregation Configuration**: Aggregation method selection (average/max/min) for multi-examiner cases
6. **Canvas Export UI**: Complete the UI for exporting results to Canvas-compatible CSV format (PRD requirement)
7. **Mixed Assessment Support**: Full support for assessments with both individual and group components (PRD requirement)
8. **Audit Logging & Compliance**: Implement audit trail and verify WCAG accessibility compliance (PRD requirement)
