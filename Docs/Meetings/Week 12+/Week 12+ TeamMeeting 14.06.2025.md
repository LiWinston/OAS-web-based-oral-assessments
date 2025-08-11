# Week 12+ Team Meeting Minutes

| **Meeting Information** |                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Date:**               | June 14, 2025                                                                                                            |
| **Time:**               | 13:00 – 14:30                                                                                                          |
| **Location:**           | Online (Zoom)                                                                                                           |
| **Facilitator:**        | Yunpeng Xiong                                                                                                           |
| **Note Taker:**         | Haocheng Li                                                                                                             |
| **Attendees:**          | All members |

## Agenda

1. Final CI/CD & Production Deployment Status (20 mins)
2. CORS Implementation Planning (10 mins)
3. Frontend Integration Status (25 mins)
4. Documentation & Submission Readiness (20 mins)
5. Open Issues & Action Items (15 mins)

## Discussion Items

### 1. Final CI/CD & Production Deployment Status

- Discussed plans for frontend containerization with `Dockerfile` and integration into `docker-compose.yml`.
- Backend configuration updates needed for deployment:
  - Decision to hardcode database URL for deployment stability.
  - Agreement to move sensitive credentials to environment variables for enhanced security.
- Identified need to update `package.json` to resolve dependency issues.
- Decision to use email as username for consistency in test data.
- Agreed to freeze codebase except for critical bug fixes until final demo.

### 2. CORS Implementation Planning

- Discussed need for comprehensive CORS solution:
  - Plan to add global `CorsConfig` & high-priority `GlobalCorsFilter`.
  - Identified issue with missing CORS headers in API responses.
  - Discussed handling of OPTIONS preflight requests.
  - Decided to update application.yml to use CORS_ALLOWED_ORIGINS environment variable.
- Scheduled front-end smoke test to confirm successful API calls without CORS errors.

### 3. Frontend Integration Status

- Reviewed progress on frontend development with planned features:
  - Complete login portal for all user roles with security design.
  - Logout functionality implementation.
  - Course admin dashboard and profile page with responsive design.
  - Super admin dashboard with invite course admin feature.
  - Course creation page with enhanced UX compared to prototype.
  - Documentation FAQ page for application learning.
- Discussed need to fix linter errors to ensure code quality.
- Planned integration with backend login API.

### 4. Documentation & Submission Readiness

- Discussed documentation needs:
  - Week 12 meetings and Sprint 3 ceremonies documentation.
  - Deployment diagram for architecture documentation.
  - Arthas Basic Usage Guide for Docker Environment to aid debugging.
- Reviewed CSV File Preview Feature implementation for better user experience.
- Confirmed addition of super admin role as required in specifications.
- Reminded all team members to submit weekly reports for Week 12 by Sunday.

### 5. Open Issues & Action Items

| **Task**                                        | **Assignee** | **Due Date** |
| ----------------------------------------------------- | ------------------ | ------------------ |
| Implement CORS solution                               | Yunpeng Xiong      | 14 Jun 23:59       |
| Complete frontend containerization                    | Yunpeng Xiong      | 15 Jun 09:00       |
| Frontend-backend integration                          | Yanqing Shi        | 14 Jun 23:59       |
| Create Arthas debugging guide                         | Dongqiao He        | 15 Jun 09:00       |
| Complete remaining documentation for submission       | Haocheng Li        | 15 Jun 23:00       |

## Decisions

1. **Code Freeze** to be implemented after major features are merged - only release-blocking fixes allowed after June 12.
2. **Deployment Strategy** finalized using Docker Compose for both frontend and backend.
3. **CORS Configuration** to be implemented with environment variable support.
