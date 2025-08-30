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
│   │   ├── assessments/         # Assessment conduct
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
│   │   ├── courses/             # Course management
│   │   └── admins/              # Admin user management
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
│   ├── examinerTimeslotService.js # Examiner self-assignment and schedule management
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
│   └── useTimeslotAssignment.js # Timeslot assignment logic with conflict detection
│
├── lib/                         # Utilities and providers
│   ├── providers.jsx            # React Query provider
│   └── utils.js                 # Helper functions
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

- Course Admin interface: 80% complete (missing comment library)
- Super Admin interface: 90% complete
- Student interface: 20% complete (dashboard complete, booking/results pending)
- Examiner interface: 20% complete (dashboard and scheduling complete, marking pending)
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

## Frontend Implementation Status

The following reflects the current state of the frontend only. Backend capabilities are provided by a separate Spring Boot service. Status levels:

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

### Rubric and Feedback Customization — 🚧 Frontend Ready (mock)

- Current: Full rubric builder UI, drag-and-drop criteria, performance levels, and predefined comments; service mocks in place.
- Target: Connect rubric CRUD to Spring Boot.
- User can: Configure rubrics in UI with mock persistence.

### Student Groups System — ✅ Complete (with mock services)

- Current: Complete student groups interface with group overview and detailed member information; comprehensive mock API layer with realistic test data.
- Implementation: Assignment-level group membership display, group overview with card/table views, detailed member information with contact details, responsive design with mobile optimization, comprehensive error handling for access control.
- User can: View all active group memberships with course/assignment context; switch between card and table view for group overview; access detailed group information including all member details with contact information; see group collaboration tips and guidelines; refresh group data manually.
- Features: Professional gradient-themed interface matching student dashboard design; avatar generation for group members; search and filtering capabilities; responsive mobile-first design; error boundaries and loading states.
- API Integration: Following Student-Groups-API-Contracts specification with GET `/api/students/{studentId}/groups` for overview and GET `/api/students/{studentId}/groups/{groupId}` for details; mock service with realistic delays and error scenarios; membership validation and access control simulation.

### Student/Group Data Import — 🚧 Frontend Ready (backend endpoints available)

- Current: CSV upload UI integrated in assignment workflows; frontend ready to call backend.
- Backend: Spring Boot /api/csv/preview and /api/csv/import available.
- User can: Upload CSV in UI; integration to backend to be finalized in services.

### Scheduling & Time Slot Management — ❌ Not Started

- Current: No scheduling UI yet (time slots, venues, conflict detection).
- Target: Build scheduling UI and integrate with backend scheduling APIs.
- User can: Not available yet.

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

### Assessment Execution (Examiner Interface) — ✅ Complete (UI implemented)

- Current: Full examiner dashboard with comprehensive assessment management interface implemented.
- Implementation: Complete layout with sidebar navigation, dashboard components, and all examiner pages.
- User can: Access professional examiner dashboard; view today's schedule; manage pending feedback; use comment library; navigate to assessment, results, schedule, documentation, and profile pages.

### Mark Calculation & Aggregation — ❌ Not Started

- Current: No aggregation UI.
- Target: Show aggregated results and configure methods; backend computes.
- User can: Not available yet.

### Reporting and Analytics — ❌ Not Started

- Current: No reports UI yet (scheduling overview, marking results, examiner trends).
- Target: Build reports UI and integrate exports.
- User can: Not available yet.

### Results Release Control — ❌ Not Started

- Current: No results release controls in UI.
- Target: Implement release flow and student visibility controls.
- User can: Not available yet.

### Canvas LMS Integration — ❌ Not Started

- Current: No Canvas import/export implemented in UI.
- Target: Add CSV export of results and student import alignment with Canvas formats.
- User can: Not available yet.

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

**🚧 Critical Gaps**

- **Comment Library System**: Missing centralized comment management (only basic comments in rubric)
- **Student Booking System**: Dashboard complete, but booking interface and results viewing need backend integration
- **Examiner Marking Interface**: Dashboard and scheduling complete, but marking interface needs implementation
- **Time Slot Management**: Examiner self-assignment complete, but course admin scheduling needs backend integration
- **Assessment Execution**: No examiner marking interface or draft saving
- **Results System**: No mark aggregation, release control, or Canvas export

**📋 Next Phase Priorities**

1. **Comment Library**: Implement centralized comment management with search and analytics
2. **Student Booking System**: Complete time slot selection and group coordination
3. **Examiner Marking Interface**: Build assessment form with rubric and comment integration
4. **Scheduling System**: Create time slot management with venue assignment
5. **Database Connection**: Connect API routes to MySQL database
6. **Results Management**: Implement mark aggregation and Canvas export
