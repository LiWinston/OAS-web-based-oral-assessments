# Meeting Minutes: Project OAS - Team Meeting

**Date:** May 10, 2025  
**Time:** 2:00 PM - 4:30 PM  
**Attendees:** All team members

## 1. Purpose

To finalize Sprint 3 planning, assign specific tasks to team members, and establish a clear roadmap for the upcoming sprint based on updated requirements from the client feedback received in Week 8.

## 2. Review of Sprint 2 and Planning for Sprint 3

The team discussed the outcomes of Sprint 2 and outlined the objectives for Sprint 3, with a focus on implementing core system components and updating documentation based on client feedback.

- **Sprint 3 Overview:**

  - Duration: 2 weeks (April 28, 2025 - May 11, 2025)
  - Goal: Update requirements documentation based on client feedback and begin implementation of core system components (backend)

- **Documentation Updates:**

  - UI prototypes have been updated but require further refinement based on client feedback
  - ER Diagram is completed but needs adjustments to accommodate the two-tier admin structure
  - Sequential and Use Case diagrams have been drafted but require review and updates

- **System Implementation Priorities:**
  - Discussed backend priorities: Data import/export, user account management, and Super Admin management
  - Database schema creation needs to be completed by Weiran Xu
  - CSV handling will be moved to the assignment level as per client feedback

## 3. Key Discussion Points

- **Admin Roles Implementation:**

  - Confirmed two-tier admin structure (Super Admin and Course Admin)
  - Super Admin will manage Course Admin access via email invitation
  - Course Admin will have an onboarding process when first logging in
  - Task assigned to Yanqing Shi for Super Admin role UI prototype refinement

- **Student Interface Requirements:**

  - Students need to manage their assessments, view results and feedback
  - Students should be able to view group members and book sessions
  - For group assignments, any student can book on behalf of the group, and all group members can see the booking

- **UI Prototype Refinements:**

  - **Super Admin Role (Priority):** Email invitation system for onboarding course admins (Yanqing Shi)
  - **Course Admin Role (Priority):**
    - Admin time slot definition (Ian Chi)
    - Course definition, assignment configuration, predefined comments, rubric builder (Casper/Haocheng Li)
  - **Examiner Role:**
    - Examiner marking interface (Casper/Haocheng Li)
    - Examiner time slot management (Ian Chi)
  - **Student Role:**
    - Assessment management, results/feedback view, group information, booking functionality (Yukun Fu)

- **Technical Implementation:**
  - Backend team to create subtasks under user stories rather than marking entire user stories as complete
  - Testing approach will involve team members testing each other's code
  - Issues from previous sprints were reviewed and resolved during the meeting

## 4. Key Decisions Made

- **Task Distribution:**

  - UI Prototype work divided among team members based on roles and functionality
  - Diagram refinements assigned to specific team members:
    - ER Diagram: Weiran Xu, Yongchun Li, Dongqiao He
    - Sequential Diagram: Xiang Wang
    - Use Case Diagram: Benyuan Wang

- **Development Approach:**

  - Backend team will focus on implementing Epics 1, 2, and 9 (Data Import/Export, User Account Management, Super Admin Management)
  - Frontend team will focus on UI prototype refinements before beginning implementation
  - Testing will be conducted by team members testing components developed by others

- **Communication Improvements:**
  - Client contact will be handled by Ian Chi for Sprint 3 review and retrospective
  - Meeting agendas will be shared at least 24 hours before each meeting
  - Time boxing for discussion topics (maximum 15 minutes per topic) will be implemented

## 5. Action Items

| Action Item                               | Owner(s)                            | Due Date             | Status      | Notes                                                            |
| :---------------------------------------- | :---------------------------------- | :------------------- | :---------- | :--------------------------------------------------------------- |
| **UI Prototype Refinements**              |                                     |                      |             |                                                                  |
| Super Admin Role UI                       | Yanqing Shi                         | May 11, 2025         | In Progress | Focus on email invitation and onboarding for course admins       |
| Course Admin Role UI                      | Ian Chi, Haocheng Li (Casper)       | May 11, 2025         | In Progress | Time slots, course definition, assignment config, rubric builder |
| Examiner Role UI                          | Ian Chi, Haocheng Li (Casper)       | May 11, 2025         | In Progress | Lower priority than admin roles                                  |
| Student Role UI                           | Yukun Fu                            | May 11, 2025         | In Progress | Assessment management, results, group info, booking              |
| **Documentation Updates**                 |                                     |                      |             |                                                                  |
| Update User Stories & Acceptance Criteria | Ian Chi                             | May 11, 2025         | In Progress | Reflect new admin role structure                                 |
| Update ER Diagram                         | Weiran Xu, Yongchun Li, Dongqiao He | May 11, 2025         | In Progress | Align with revised requirements                                  |
| Update Sequential Diagram                 | Xiang Wang                          | May 11, 2025         | In Progress |                                                                  |
| Update Use Case Diagram                   | Benyuan Wang                        | May 11, 2025         | In Progress |                                                                  |
| Complete Product Requirements Document    | Team                                | May 11, 2025         | To Do       |                                                                  |
| **Development Tasks**                     |                                     |                      |             |                                                                  |
| Create Database Schema (SQL)              | Weiran Xu                           | May 11, 2025         | To Do       |                                                                  |
| Implement Epic 1: Data Import/Export      | Backend Team                        | May 11, 2025         | To Do       | User stories 1.1-1.5                                             |
| Implement Epic 2: User Account Management | Backend Team                        | May 11, 2025         | To Do       | User stories 2.1.1-2.4                                           |
| Implement Epic 9: Super Admin Management  | Backend Team                        | May 11, 2025         | To Do       | User stories 9.1-9.5                                             |
| Set up Testing Framework                  | Team                                | May 11, 2025         | To Do       | Will be assigned after initial implementation                    |
| **Communication**                         |                                     |                      |             |                                                                  |
| Contact Client for Sprint 3 Review        | Ian Chi                             | Before end of Sprint | To Do       |                                                                  |

## 6. Next Steps

- Team members to begin working on their assigned tasks immediately
- Backend team to create subtasks for their assigned user stories
- Frontend team to refine UI prototypes based on assigned roles
- Questions for the client to be consolidated and communicated by Ian Chi
- Next team meeting to be scheduled to review progress before the end of Sprint 3
- Implementation of the communication plan improvements to begin with the next meeting

## 7. Communication Plan

Based on the Sprint 2 retrospective, the following communication improvements will be implemented:

### Enhanced Client Communication

- Schedule regular check-ins with the client (bi-weekly) rather than relying solely on email
- Create a standardized format for requirement clarification questions
- Share prototype updates incrementally to gather early feedback

### Improved Team Meetings

- Create and share meeting agendas at least 24 hours before each meeting
- Implement time boxing for discussion topics (maximum 15 minutes per topic)
- Use structured participation techniques to ensure all team members have an opportunity to contribute

### Documentation Sharing

- Establish a central repository for all working documents
- Implement a standard review process for all documentation updates
