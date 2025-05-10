# Sprint 2 Review

## Sprint Information

**Duration:** Week 5 - 8 (30/03/2025 - 20/04/2025)
**Goal:** Complete system design and architecture documentation

## Sprint Objectives Status

### ✅ Completed Objectives

1. **Prototype Development**
   - Design main theme of prototype
   - Hi-Fi Prototype UI development
   - Define prototype user flow
2. **Architecture Design**
   - Class Diagram
   - Use Case Diagram
   - Sequence Diagram
   - Component Diagram
   - Deployment Diagram
   - Database Diagram
3. **Backend Infrastructure Setup**
   - Simplify the construction of MyBatis-Plus query conditions
   - Implement logging support to aid in debugging and tracing.
   - Encapsulate commonly used utility classes
   - Enhance API security through filters
   - Unify the exception handling mechanism of the system
   - Extend Hutool's Convert utility class
4. **Design Concept Documentation**
   - Create system component diagram/UML
   - Technology Stack Documentation
   - Reuse Plan
   - Learning Resources
5. **Other Documentations**
   - Booking System Solution Analysis
   - Research and Development Plan
   - System Api Analysis
   - Testing plan

### 🔄 In Progress

- Prototypes need to be updated based on client's feedback
- User Stories, Diagrams and PRD need revisions based on the feedback.

### 📋 Key Achievements

1. Aesthetically Refined and user-friendly high-fidelity prototypes
2. Detailed architecture diagrams clearly illustrate the system structure
3. Backend Infrastructure Setup conducive to subsequent development
4. Comprehensive documentation presenting the system design and solution

## Blockers and Dependencies

- Updates for user stories, diagrams and prototypes pending acceptance test and usability test

## Key Decisions

1. Refactor Admin Roles: Change the system admin role structure from a single admin role to two admin roles (Super Admin and Course Admin)
2. Update CSV Handling: Move student/group CSV import/update functionality to the assignment level instead of course level
3. Change Assignment Types: Add 'Mixed' assignment type instead of just two types of 'Individual' and 'Group'
4. API: Build the booking/scheduling system entirely in-house instead of completely relying on third-party APIs
5. Comment Library Function：Due to potential concurrency issues with the overall comment library, we will first implement only the specific criteria comment library. The overall comment library will require further confirmation later.

## Next Steps

1. Follow up with the client on outstanding questions (CSV formats, report example, examiner count consistency).
   Team to prioritize updating documentation (User Stories, Diagrams, PRD) and the UI prototype based on the client feedback
2. Team to prioritize updating documentation (User Stories, Diagrams, PRD) and the UI prototype based on the client feedback
3. Development work in Sprint 3 will initially focus on foundational changes (Admin roles, CSV location) and non-blocked features. Major work on scheduling and rubrics will commence after design refinement and potentially further client validation.
