# Meeting Minutes: Project OAS - Team Meeting

**Date:** May 3, 2025
**Time:** 2pm - 4.30 pm
**Attendees:** All team members
**1. Purpose**

To discuss the feedback, requirements changes, and major pivots identified during the Mid-Term Client Meeting held on May 2, 2025, and to plan the next steps and assign action items for Sprint 3.

**2. Review of Client Meeting Feedback & Key Discussion Points**

The team reviewed the significant changes and clarifications requested by the client (Hasti Samadi) during the May 2nd meeting. The discussion focused on understanding the implications and planning the necessary adjustments.

- **Admin Roles (Super Admin vs. Course Admin):**

  - Confirmed the need for a two-tier admin structure:
    - **Super Admin (Website/School Level):** Manages Course Admin access, views high-level course list (read-only), does not manage individual course details unless also a Course Admin for that specific course.
    - **Course Admin (Subject Coordinator):** Manages specific courses they own, including all configurations (assignments, students via CSV at assignment level, rubrics, time slots, examiners).
  - Discussed naming conventions (Super Admin vs. Website Admin; Course Admin vs. Subject Coordinator). Agreed to use Super Admin and Course Admin for clarity internally.
  - _Impact:_ Requires significant changes to user roles, permissions, database schema, and UI.

- **Student/Group Data Management (CSV Upload):**

  - Confirmed client requirement: Student/group CSV data must be uploaded and managed at the **assignment level**, not the course level.
  - The system must allow **updating/overwriting** the CSV file for an assignment during the semester.
  - Discussed rationale: Student participation can vary per assignment (e.g., withdrawals). Managing at the assignment level keeps historical data intact even if students drop the course later.
  - _Impact:_ Requires moving CSV upload functionality within the assignment configuration flow. Need to clarify the exact format for individual, group, and mixed assignment CSVs from the client.

- **Assignment Types:**

  - Confirmed the need for a **'Mixed'** assignment type, allowing both group and individual components within a single assignment, alongside 'Individual only' and 'Group only'.
  - Discussed how this impacts the marking interface (examiner needs to mark both components) and mark aggregation.
  - _Impact:_ Update assignment creation UI and backend logic for marking/aggregation.

- **Rubric Configuration (Major Customization):**

  - Confirmed extensive customization requirements:
    - **Performance Levels:** Admins must be able to define the _number_ of levels per criterion (can vary between criteria), _customize level names_ (e.g., "Excellent" instead of "Outstanding"), and _manually_ assign specific point _values_ to each level (not auto-calculated ranges). Validation needed (level mark <= criterion total mark).
    - **Predefined Comments:** Must be defined and managed _per criterion_ within the rubric builder.
    - **Examiner Contribution to Comments:** Examiners must be able to _add new comments_ to the shared library (per criterion) during the marking process, and these additions should be visible to other examiners for that assignment.
  - Discussed UI implementation: Integrating comment management directly into the rubric builder might make the UI cluttered. Explored adding comments via a modal after criterion creation or having a separate linked view.
  - Discussed database implications: Storing custom level names, marks, and criterion-specific comments.
  - Discussed examiner comment addition logic: Agreed that examiners should only be able to _add_ new comments to the library, not edit or delete existing ones, to avoid data consistency issues and conflicts with admin configurations.
  - _Impact:_ Major redesign of the rubric builder UI/logic and database schema. Examiner marking interface needs updating.

- **Time Slot Configuration & Scheduling (Major Overhaul):**

  - Confirmed the previous approach (examiner declares general availability) is invalid.
  - Admin-Driven Setup:
    - Admins define _specific, discrete time slots_ with customizable start time, end time, duration, _venue/location_, _number of examiners required_ per slot, and _number of assessment sessions/groups_ accommodated per slot.
    - System must support _parallel/concurrent_ time slots (same time, different venues/examiners).
  - Examiner Assignment:
    - Examiners view these _specific, detailed slots_ and _actively assign themselves_ to them.
    - Admins need to set a _limit on the total number of assessment sessions_ (not time slots) an examiner can take per assignment.
  - Discussion on Consistency: Debated whether the number of required examiners must be consistent for all sessions within a time block (e.g., 9-12 AM). Initial interpretation differed, but agreed on a pragmatic approach: allow admins to set a default number of examiners/venue for a block, but provide the _flexibility to edit individual sessions_ within that block if needed (recognizing this might be an edge case).
  - UI Approach: Agreed that a table view or a calendar-like view (similar to MyTimetable) would be suitable for both admin configuration and examiner self-assignment, clearly showing parallel slots and details.
  - _Impact:_ Complete rebuild of the scheduling system (in-house, no third-party API). Requires new UIs for admin and examiner, complex backend logic, and significant data model changes.

- **Examiner Marking Interface:**

  - **Comments:** Integrate criterion-specific predefined comment selection and the ability for examiners to _add_ new comments to the shared library (as discussed under Rubrics).
  - **Notes:** The 'Private Note' feature should be relabelled 'Notes' and be visible to the Course Admin, not just the examiner.
  - **Individual Marking View:** Discussed client suggestion for a list view vs. tabs/dropdown for marking individuals within a group. Decision deferred pending further UI design/feasibility check.
  - _Impact:_ UI adjustments, integrate comment library logic, change notes visibility.

- **Reporting Requirements (Admin):**

  - Confirmed need for three specific reports:
    - **Scheduling Overview:** Table showing defined slots, venue, assigned examiners, validity status (based on examiner assignment vs. requirement), and booked students/groups. (Need example spreadsheet from client).
    - **Mark Results & Aggregation:** Detailed view of marks per criterion from each examiner, admin selection for aggregation (Avg/Max/Min), consolidated comments per criterion, final aggregated marks.
    - **Examiner Marking Trends:** Real-time (or near real-time) view of average marks given by each examiner for an assignment (filterable by criterion) to monitor consistency.
  - _Impact:_ Significant backend development for data aggregation and new UI for report views.

- **Booking System API:**
  - Confirmed the decision to **build the booking/scheduling functionality entirely in-house** due to the high level of customization required by the client, making standard third-party APIs unsuitable.
  - _Impact:_ Increased development effort for this module.

**3. Key Decisions Made**

- **Admin Roles:** Adopt the two-tier (Super Admin, Course Admin) structure as requested by the client. Use these specific terms internally.
- **CSV Data:** Manage student/group data at the assignment level, allowing updates/overwrites. Follow up with the client for specific format examples.
- **Assignment Types:** Implement the 'Mixed' assignment type alongside 'Individual' and 'Group'.
- **Rubrics:** Proceed with the major customization requirements (flexible levels, manual marks, criterion-specific comments). Examiners will only be allowed to _add_ to the comment library, not edit/delete.
- **Scheduling:** Rebuild the scheduling system in-house. Implement the admin-driven detailed time slot configuration. Adopt the approach of setting default parameters (examiner count, venue) for a time block but allowing modification of individual sessions within it. Use a table/calendar-like UI for admin/examiner views.
- **Examiner Interface:** Relabel 'Private Notes' to 'Notes' and make them visible to Course Admins. Integrate the agreed comment library functionality. Defer decision on the individual marking list view.
- **Reporting:** Implement the three specified admin reports (Scheduling Overview, Mark Results/Aggregation, Examiner Trends).
- **API:** Build the booking/scheduling system entirely in-house.
- **PR Reviews:** Reduce the required number of reviewers per Pull Request from 4 to 2.
- **Sprint 3 Focus:** Prioritize documentation updates (User Stories, Diagrams, PRD) and prototype revisions based on client feedback. Initial development will focus on non-blocked features (e.g., Super Admin basics, CSV location change). Major pivoted features (scheduling, rubrics) will be developed after design refinement.
- **Product Requirements Document (PRD):** Acknowledge the need for and assign ownership to create a PRD to detail the complex updated requirements and flows.

**4. Sprint 2 Wrap-up & Sprint 3 Planning**

- Reviewed pending Pull Requests (PRs) from Sprint 2. Discussed merge conflicts and review requirements (initially 4, reduced to 2 reviewers per PR for efficiency). Team members actioned required reviews and merges during the meeting.
- Discussed the impact of client feedback on Sprint 3 plans. Agreed that significant effort in Sprint 3 will be dedicated to revising documentation, prototypes, and database designs based on the pivots.
- Implementation will focus initially on less-impacted areas or foundational elements (e.g., basic Super Admin UI, non-booking related admin features) while the core pivoted features (rubrics, scheduling) are redesigned.
- Acknowledged the need for documentation updates (User Stories, Acceptance Criteria, Diagrams) and potentially creating a Product Requirements Document (PRD) to detail the revised flows and interactions, especially given the complexity.

**5. Action Items**

| Action Item                                                                      | Owner(s)                                        | Due Date     | Status       | Notes                                                                                                                             |
| :------------------------------------------------------------------------------- | :---------------------------------------------- | :----------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Documentation & Design Updates**                                               |                                                 |              |              |                                                                                                                                   |
| Revise User Stories & Acceptance Criteria                                        | Ian CHI (PO)                                    | May 11, 2025 | To Do        | Reflect all client meeting pivots.                                                                                                |
| Update UI Prototype - Super Admin                                                | Yanqing Shi                                     | May 11, 2025 | To Do        | Create simple UI based on defined Super Admin role.                                                                               |
| Update UI Prototype - Course Admin (excluding Booking/Scheduling)                | Ian CHI, Haocheng Li (Casper)                   | May 11, 2025 | To Do        | Update assignment creation, rubric builder, basic examiner management, reporting stubs.                                           |
| Update UI Prototype - Booking/Scheduling (Admin, Examiner, Student views)        | Ian CHI, Haocheng Li (Casper)                   | TBD          | To Do        | Requires significant redesign based on new requirements. Lower priority for initial prototype update.                             |
| Update UI Prototype - Examiner Marking Interface (less urgent)                   | Ian CHI                                         | TBD          | To Do        | Update comment handling, notes visibility. Defer individual marking view decision.                                                |
| Update ER Diagram                                                                | Weiran Xu, Yongchun Li                          | May 11, 2025 | To Do        | Reflect new admin roles, assignment-level CSVs, rubric structure, scheduling data model. Requires careful design and review.      |
| Update Sequential Diagrams                                                       | Xiang Wang                                      | May 11, 2025 | To Do        | Reflect updated user flows based on pivots.                                                                                       |
| Update Use Case Diagram                                                          | Benyuan Wang                                    | May 11, 2025 | To Do        | Reflect updated user roles and interactions.                                                                                      |
| Create/Update Product Requirements Document (PRD)                                | Yunpeng Xiong (Nemo), Haocheng Li, Benyuan Wang | May 11, 2025 | To Do        | Detail updated user flows, interactions, UI elements, and requirements, especially for complex areas like scheduling and rubrics. |
| **Client Follow-up**                                                             |                                                 |              |              |                                                                                                                                   |
| Request Example CSV Formats (Individual, Group, Mixed)                           | Ian CHI                                         | ASAP         | Sent (May 3) | Follow up if no response.                                                                                                         |
| Request Example Spreadsheet for 'Scheduling Overview' Report                     | Ian CHI                                         | ASAP         | Sent (May 3) | Follow up if no response.                                                                                                         |
| Clarify if Examiner Count per Session _must_ be consistent (confirm flexibility) | Ian CHI                                         | ASAP         | To Do        | Confirm understanding based on team discussion (default consistency, allow overrides).                                            |
| **Sprint 3 Development Tasks (Initial Focus)**                                   |                                                 |              |              |                                                                                                                                   |
| Implement Basic Super Admin UI/Logic                                             | Backend Team / Frontend Team                    | May 11, 2025 | To Do        | Based on updated prototype/requirements.                                                                                          |
| Refactor Backend for Two-Tier Admin Roles                                        | Backend Team                                    | May 11, 2025 | To Do        | Implement database changes and access control logic.                                                                              |
| Move CSV Upload Logic to Assignment Level                                        | Backend Team / Frontend Team                    | May 11, 2025 | To Do        | Update relevant backend services and Course Admin UI.                                                                             |
| **Process & Admin**                                                              |                                                 |              |              |                                                                                                                                   |
| Complete Sprint 2 PR Merges                                                      | All relevant team members                       | ASAP         | In Progress  | Ensure all reviewed PRs are merged to `dev`.                                                                                      |
| Update Jira Board for Sprint 3                                                   | Ian CHI (PO)                                    | May 4, 2025  | To Do        | Add new tasks based on action items, adjust existing tasks.                                                                       |
| Write Sprint 2 Retrospective & Sprint 3 Planning Docs                            | Team (Volunteer/Assign)                         | Mid-Sprint 3 | To Do        | Assign owners.                                                                                                                    |
| Schedule Next Client Meeting (Aim for 2-3 weeks)                                 | Ian CHI / Haocheng Li                           | ASAP         | To Do        | To review refined prototype and confirm direction.                                                                                |

**6. Next Steps**

- Ian CHI to follow up with the client on outstanding questions (CSV formats, report example, examiner count consistency).
- Team to prioritize updating documentation (User Stories, Diagrams, PRD) and the UI prototype based on the client feedback.
- Backend team (Weiran Xu, Yongchun Li) to focus on redesigning the ER Diagram/database schema.
- Development work in Sprint 3 will initially focus on foundational changes (Admin roles, CSV location) and non-blocked features. Major work on scheduling and rubrics will commence after design refinement and potentially further client validation.
- Complete Sprint 2 wrap-up tasks (PR merges, Jira board updates).
- Assign owners for Sprint 2 Retrospective and Sprint 3 Planning documents.
- Schedule the next internal team meeting to review progress on documentation and design updates.
