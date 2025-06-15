# Sprint 3 Review

| **Meeting Information** |                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Date:**               | Jun 14, 2025                                                                                                           |
| **Time:**               | 15:00 - 16:30                                                                                                           |
| **Location:**           | Online (Zoom)                                                                                                           |
| **Facilitator:**        | Ian Chi                                                                                                                 |
| **Attendees:**          | Yunpeng Xiong, Ian Chi, Dongqiao He, Weiran Xu, Yanqing Shi, Xiang Wang, Caspar Ye, Yukun Fu, Benyuan Wang, Yongchun Li |

## Sprint Information

**Duration:** Week 9 - 12 (28/04/2025 - 31/05/2025)
**Goal:** Update requirements documentation based on client feedback and begin implementation of core system components (backend)

## Sprint Objectives Status

### ✅ Completed Objectives

1. **Requirements Documentation Refinement**

   - Updated user stories and acceptance criteria to reflect the new admin role structure (Super Admin and Course Admin)
   - Revised UI prototypes based on client feedback
   - Updated diagrams (ER, Sequential, Use Case) to align with revised requirements
   - Completed the Product Requirements Document (PRD)
2. **Initial System Implementation (Backend)**

   - Epic 1: Data Import and Export
     - User story 1.1: Implemented CSV import for student data
     - User story 1.2: Implemented CSV import for group data
     - User story 1.3: Created export functionality for assessment results
     - User story 1.4: Implemented data validation for imports
     - User story 1.5: Added error handling for import/export operations
   - Epic 2: User Account Management
     - User story 2.1.1: Implemented user registration
     - User story 2.1.2: Created login functionality
     - User story 2.1.3: Added password reset capabilities
     - User story 2.2.1: Implemented role-based access control
     - User story 2.2.2: Created user profile management
     - User story 2.2.3: Added session management
     - User story 2.3: Implemented account deactivation/reactivation
     - User story 2.4: Created audit logging for user actions
   - Epic 9: Super Admin Management
     - User story 9.1: Implemented system configuration settings
     - User story 9.2: Created course admin management
     - User story 9.3: Added system-wide reporting
     - User story 9.4: Implemented system backup functionality
     - User story 9.5: Added system health monitoring
3. **Database Implementation**

   - Created database schema according to the design
   - Implemented database migrations
   - Set up data seeding for testing environments
   - Configured database connection pooling for performance
4. **Testing Framework Setup**

   - Established testing methodology and standards
   - Set up automated testing infrastructure
   - Created initial test cases for completed components
   - Implemented CI/CD pipeline for automated testing

### 🔄 In Progress

- Frontend implementation for Super Admin and Course Admin interfaces
- Integration testing between frontend and backend components
- Implementation of booking system functionality
- Development of assessment rubric builder

### 📋 Key Achievements

1. Successfully refactored the admin role structure to include Super Admin and Course Admin roles
2. Implemented secure authentication and authorization system with role-based access control
3. Created robust data import/export functionality with proper validation and error handling
4. Established comprehensive testing framework with automated test execution

## Blockers and Dependencies

- Frontend development is dependent on finalized API specifications from backend
- Booking system implementation requires confirmation on calendar integration approach
- Complete rubric builder functionality awaiting client feedback on specific requirements

## Key Decisions

1. **Authentication Approach**: Implemented JWT-based authentication with refresh token mechanism for improved security
2. **Database Structure**: Finalized the database schema with proper relationships between entities
3. **API Design**: Adopted RESTful API design principles with consistent endpoint naming conventions
4. **Error Handling**: Implemented standardized error response format across all API endpoints
5. **Testing Strategy**: Decided on a combination of unit, integration, and end-to-end testing approaches

## Next Steps

1. Complete frontend implementation for all user interfaces
2. Finalize integration between frontend and backend components
3. Implement remaining functionality for booking system and assessment rubrics
4. Conduct comprehensive testing of the entire system
5. Prepare for user acceptance testing with client stakeholders
