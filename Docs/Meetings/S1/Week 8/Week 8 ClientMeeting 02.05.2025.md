# **Meeting Minutes: Project OAS \- Mid-Term Client Meeting**

Date: May 2, 2025  
Time: 12.30 am - 2 pm
Attendees:

- **Client:** Hasti Samadi
- **Team:** Ian CHI, Haocheng Li (representing the development team)

## **1\. Agenda**

- Team Progress Update
- Review of Requirements (Project Scope, User Stories, Acceptance Criteria)
- Prototype Demonstration (Admin, Examiner Flows)
- Discussion: API Integration Approach (Booking System)
- Project Timeline & Next Steps

## **2\. Team Progress & Requirements Review**

- **Team Progress:** Established GitHub repository, refined user stories/acceptance criteria, completed stakeholder analysis and project scope, finalized architecture design, developed prototype. Currently in Sprint 2\.
- **Project Scope & User Stories Review:** Ian reviewed the key points from the project scope and user stories documents previously shared with the client.
  - **Core Problem:** Streamline inefficient manual oral assessment processes.
  - **Users:** Students, Examiners, Administrators.
  - **Key Features (Initial Understanding):** User management, assessment configuration (academic period, assignment setup, customizable rubrics), scheduling/booking (admin defines slots, examiners self-assign availability, students book), assessment execution (examiner interface, feedback recording, predefined comments), mark management (aggregation, visibility control, Canvas export), basic notifications, CSV integration.
  - **Out of Scope Items:** Direct university system integration (SSO), mobile apps, advanced analytics, AI grading, live video assessment.
- **Client Confirmation:** Hasti generally agreed with the reviewed scope and user stories, with clarifications noted below.

## **3\. Prototype Demonstration & Key Discussion Points / Pivots**

The team demonstrated the prototype for the Administrator and Examiner user flows. Significant feedback and new requirements emerged, leading to major pivots:

**3.1. Administrator Roles & Access Control (Major Pivot)**

- **Initial Assumption:** One type of Administrator.
- **Client Requirement:** Two distinct admin levels are needed:
  - **Super Admin (Website/School Level):**
    - Grants access _to the system_ for Subject Coordinator Admins (approves their account creation).
    - Has a _read-only_ view of _all_ subjects/courses created across the system (high-level view, e.g., subject name, coordinator).
    - Does **not** see confidential details like student lists, groups, or marks within subjects they don't own.
    - Does **not** perform detailed configurations like modifying assessments or student data within specific courses (unless they are also a Subject Coordinator for that course).
  - **Subject Coordinator Admin (Course Level):**
    - This is the role demonstrated in the prototype (referred to as 'Course Admin' going forward).
    - Once granted access by the Super Admin, they can create and manage their _own_ courses/subjects.
    - Can only see and manage the courses they create/own.
    - Performs all detailed configurations: creating assignments, uploading student data, defining rubrics, setting up time slots, managing examiners _for their specific course_, viewing detailed reports _for their course_.
- **Impact:** Requires restructuring the admin user flow, database schema (to associate courses with specific admins), and access control logic.

**3.2. Student/Group Data Management (CSV Upload)**

- **Initial Assumption:** Student data uploaded at the _course_ level.
- **Client Requirement:**
  - Student/group CSV data should be uploaded and managed at the _assignment_ level, not the course level.
  - The system must allow _overwriting/updating_ the CSV file for an assignment during the semester (e.g., if students withdraw or groups change). Changes made in LMS should be reflected by re-uploading the CSV.
- **Impact:** Change the UI/logic for CSV upload to be within the assignment configuration, not course configuration. Ensure the update functionality correctly replaces or merges data as needed.

**3.3. Assignment Types**

- **Initial Assumption:** Assignments are either 'Individual' OR 'Group'.
- **Client Requirement:** An assignment can be:
  - Individual only
  - Group only
  - **Mixed:** Containing both group-marked components and individually-marked components within the _same_ assignment.
- **Impact:** Modify assignment creation UI to allow selection of 'Mixed' type. Ensure the marking interface and mark aggregation logic handle mixed assignments correctly.

**3.4. Rubric Configuration (Significant Customization Required)**

- **Initial Assumption:** Standardized levels (e.g., Outstanding, Very Good...) with potentially auto-calculated marks per level based on total criterion weight. Predefined comments managed centrally.
- **Client Requirement:** Rubrics need _much higher_ flexibility:
  - **Performance Levels:**
    - Number of levels per criterion must be customizable (e.g., one criterion might have 5 levels, another only 2 \- Pass/Fail). Admins need to add/remove levels.
    - The _name_ of each level must be customizable (e.g., change "Outstanding" to "Excellent").
    - The _mark/point value_ for each level must be manually assignable by the admin (not automatically divided). Input fields needed for each level's mark. (Add validation: level mark \<= criterion total mark).
  - **Predefined Comments:**
    - Should be defined and managed _per criterion_ within the rubric builder, not as a separate general list.
    - Examiners should also be able to _add_ new comments to this shared library (per criterion) during marking, and these additions should be visible to other examiners for that assignment.
- **Impact:** Major redesign of the rubric builder UI and logic. Database schema changes to store level names, custom marks per level, and comments associated with specific criteria.

**3.5. Time Slot Configuration & Scheduling Logic (Major Pivot)**

- **Initial Assumption:** Admin defines basic time slots (e.g., 9-10 AM); examiners declare general availability within those periods; system potentially auto-allocates. Simple concurrency.
- **Client Requirement:** Scheduling logic needs to be significantly more complex and admin-driven:
  - **Time Slot Definition:**
    - Admin defines specific, discrete time slots with customizable _start time, end time, and duration_ (e.g., 9:00-9:15, 9:30-10:00, 10:00-12:00).
    - Admin defines the _venue/location_ for _each specific time slot_.
    - Admin defines the _number of examiners required_ for _each specific time slot_ (e.g., 1 examiner, 2 examiners).
    - Admin defines the _number of assessment sessions/groups_ that can be assessed within _each specific time slot_ (e.g., a 1-hour slot might accommodate 4 assessment sessions).
  - **Concurrency:** The system must support _parallel_ time slots (multiple slots happening concurrently at the same time, potentially in different venues). The UI must clearly display these parallel options.
  - **Examiner Assignment:**
    - **Change:** Examiners should _see the specific time slots_ defined by the admin (including date, time, venue, required examiners, number of sessions) and _actively assign themselves_ to these specific slots, rather than just declaring general availability.
    - **Limit:** Admin needs the ability to set a _limit_ on the total number of _assessment sessions_ (not time slots) an examiner can be assigned to for an assignment (for fairness, workload management).
  - **Admin View/Reporting:** Admin needs a clear view/table showing defined time slots, their status (valid/invalid based on examiner assignment), assigned examiners, assigned venues, and later, booked students/groups.
- **Impact:** Complete overhaul of the time slot definition UI, examiner availability/assignment UI, and the underlying scheduling logic. Requires significant changes to data models to capture venue, examiner requirements, session counts per slot, and examiner assignment limits. The proposed examiner flow (declare availability) is no longer valid.

**3.6. Examiner Marking Interface**

- **Predefined Comments:** As per Rubric changes (3.4), comments should be selectable/addable within the marking interface, linked to the specific criterion being marked. The separate 'Feedback' tab is likely redundant or needs repurposing.
- **Individual Marking View:** Client suggested potentially listing all individual students within a group on one scrollable page for marking individual components, rather than selecting each student via dropdown/tabs, for better usability (especially if criteria count is low, \<3-5). Team to evaluate feasibility vs. potential UI clutter if criteria count is high.
- **Notes:** The 'Private Note' feature is valuable but should be relabelled 'Notes' and be visible to the _Administrator_ as well, not just the examiner (for tracking issues, exceptions).

**3.7. Reporting Requirements (Admin)**

- **Initial Assumption:** Basic reporting, primarily focused on exporting marks.
- **Client Requirement:** More detailed operational and analytical reports are needed for the Admin:
  - **Report 1: Scheduling Overview:**
    - View of all defined time slots for an assignment.
    - Show assigned venue(s) for each slot.
    - Show assigned examiner(s) for each slot.
    - Show validity status (e.g., enough examiners assigned based on requirement).
    - Show booked student/group for each session within the slot. (Client provided an example spreadsheet).
  - **Report 2: Mark Results & Aggregation:**
    - Detailed view of marks given by _each_ examiner for _each_ criterion (if multiple examiners per slot).
    - Ability for Admin to select aggregation method for marks from multiple examiners (e.g., Average, Max, Min) to calculate the final mark per criterion.
    - Consolidated view of all comments from all examiners for a specific criterion.
    - Overall aggregated comment for the entire assessment.
    - Final aggregated marks (group \+ individual components) for mixed assignments.
  - **Report 3: Examiner Marking Trends:**
    - Ability to see average marks given by _each examiner_ across all their marked sessions for a specific assignment (potentially filterable by criterion).
    - This should be available in _real-time_ (or near real-time) during the assessment period to allow for feedback to examiners.
- **Impact:** Requires significant backend logic for data aggregation and new UI development for these report views.

**3.8. Booking System API**

- **Initial Assumption:** Potential use of a third-party/open-source booking API (e.g., Cal.com).
- **Decision:** Given the highly customized and complex scheduling requirements identified (especially around admin-defined slots, examiner requirements, session counts, parallel venues), integrating a standard third-party API is likely infeasible.
- **Pivot:** The team will need to **build the booking/scheduling functionality entirely in-house.**
- **Impact:** Increases development effort significantly for the scheduling/booking features.

## **4\. User Roles, Flows, and Features (Post Mid-Term Meeting)**

This section outlines the updated understanding of user roles, their primary flows, and key features, incorporating the pivots from the meeting.

**4.1. Super Admin**

- **Role:** Highest level administrator, likely at a school or department level. Manages access for Course Admins.
- **Key Flow:** Log in \-\> Review requests/add new Course Admins \-\> Grant system access \-\> View high-level overview of all courses in the system.
- **Features:**
  - Secure Login & Account Management (Password Reset).
  - Approve/Manage Course Admin Accounts (Grant/Revoke system access).
  - View a list of all courses across the system (Read-only: Course Name, Course Admin, Semester, etc.).
  - _Does Not_ manage individual course content (assignments, students, marks) unless also acting as a Course Admin for specific courses.

**4.2. Course Admin (Subject Coordinator)**

- **Role:** Manages specific courses/subjects they are responsible for. This was the primary 'Admin' role discussed initially and in the prototype.
- **Key Flow:** Log in \-\> Select/Create Course \-\> Create/Configure Assignment \-\> Upload/Update Student/Group CSV \-\> Define Rubric \-\> Define Detailed Time Slots \-\> Add/Manage Examiners & Set Limits \-\> Monitor Scheduling & Reports \-\> Manage Result Release \-\> Export Data for Canvas.
- **Features:**
  - Secure Login & Account Management.
  - **Course Management:** Create and manage own courses (Subject, Year, Semester).
  - **Assignment Configuration:**
    - Create assignments within a course.
    - Define assignment type (Individual, Group, **Mixed**). \[Pivot\]
  - **Participant Management:**
    - Upload/Update student and group data via CSV (**at Assignment level**). \[Pivot\]
    - Add/Manage Examiners associated with the course. \[New Detail\]
    - Set **limit on total assessment sessions** per examiner for an assignment. \[Pivot\]
  - **Rubric Definition:** \[Pivot: Major Customization\]
    - Create/manage highly customizable rubrics per assignment.
    - Define criteria/sub-criteria hierarchy.
    - Customize performance levels (number, names, **manual marks**).
    - Define/manage **criterion-specific predefined comments**.
  - **Scheduling Configuration:** \[Pivot: Major Overhaul\]
    - Define specific, discrete time slots (start/end time, duration).
    - Assign **venue(s)** to each slot.
    - Specify **number of examiners required** per slot.
    - Specify **number of assessment sessions** per slot.
    - Manage **concurrent/parallel** slots.
  - **Reporting & Monitoring:** \[Pivot: New Requirement\]
    - View **Scheduling Overview Report** (slots, venues, examiners, validity, booked students).
    - View **Mark Results Report** (detailed examiner marks, aggregation options \- avg/min/max, comments).
    - View **Examiner Marking Trends Report** (real-time average marks).
  - **Results Management:**
    - Control result visibility/release timing.
    - Export marks/feedback in Canvas-compatible CSV format.

**4.3. Examiner**

- **Role:** Conducts assessments and provides marks/feedback based on Course Admin setup.
- **Key Flow:** Log in \-\> View assigned assessments \-\> View available **specific time slots** \-\> **Self-assign to desired slots** (up to limit) \-\> View personal schedule \-\> Access marking interface for a session \-\> Mark using rubric \-\> Add comments (using predefined or adding new) \-\> Add notes \-\> Save draft / Submit final \-\> View past results.
- **Features:**
  - Secure Login & Account Management.
  - View assigned courses/assessments.
  - View **detailed available time slots** (time, venue, required examiners, session count). \[Pivot\]
  - **Self-assign to specific time slots** (respecting the session limit set by Course Admin). \[Pivot\]
  - View personal assessment schedule.
  - Use marking interface (handling Individual, Group, and **Mixed** assignments). \[Refined\]
  - Apply rubric criteria for marking.
  - Use/Select **criterion-specific predefined comments**. \[Pivot\]
  - **Add new comments to the shared library** (per criterion). \[Pivot\]
  - Add **Notes** regarding the session (visible to Course Admin). \[Pivot\]
  - Save draft progress / Submit final marks and feedback.
  - View summary of own completed assessments.
  - Receive relevant notifications (e.g., reminders).

**4.4. Student**

- **Role:** Books assessment slots and views results.
- **Key Flow:** Log in \-\> View assessment details \-\> View group members \-\> View available (**validated**) time slots \-\> Book a slot (self or group) \-\> Receive confirmation \-\> View booking \-\> (Optional) Reschedule \-\> Attend assessment \-\> View released marks/feedback.
- **Features:**
  - Secure Login & Account Management.
  - Agree to Privacy Policy.
  - View assigned assessments and details.
  - View group members (if applicable).
  - View available (**validated**) assessment time slots. \[Refined\]
  - Book an available time slot (handling individual/group logic).
  - Receive email confirmation/reminders.
  - View current booking details.
  - Reschedule booking (subject to time restrictions, **potentially optional** per Admin setting). \[Pivot\]
  - View final marks and feedback after release.

## **5\. Action Items**

**For the Development Team:**

1. **Refactor Admin Roles:** Implement the two-tier admin structure (Super Admin, Course Admin) with appropriate access controls and views.
2. **Update CSV Handling:** Move student/group CSV import/update functionality to the _assignment_ level. Ensure overwriting/updating works correctly.
3. **Modify Assignment Types:** Add 'Mixed' assignment type option. Update marking and aggregation logic accordingly.
4. **Overhaul Rubric Builder:**
   - Implement fully customizable performance levels (number, names, manual mark input).
   - Allow adding/removing levels per criterion.
   - Move predefined comment management to be _per criterion_ within the rubric builder.
   - Implement logic for examiners to add to the shared comment library during marking.
5. **Rebuild Scheduling System (In-House):**
   - Create Admin UI for defining detailed time slots (duration, venue, examiner count required, assessment session count).
   - Support parallel/concurrent time slots.
   - Create Examiner UI to view specific, detailed time slots and _assign themselves_ to them.
   - Implement Admin control to limit the number of _assessment sessions_ per examiner.
   - Develop the backend logic for managing slot validity based on examiner assignments.
6. **Update Examiner Marking UI:**
   - Integrate criterion-specific predefined comment selection/addition.
   - Evaluate feasibility of the list view for individual student marking vs. tabbed/dropdown view.
   - Make the 'Notes' section visible to Admins. Remove/repurpose the 'Feedback' tab.
7. **Develop Admin Reports:** Implement the three key reports: Scheduling Overview, Mark Results/Aggregation (with avg/min/max selection), and Examiner Marking Trends (real-time).
8. **Update User Stories & Documentation:** Revise all affected user stories, acceptance criteria, and design documents to reflect these pivots.
9. **Refine Prototype:** Update the Figma prototype based on all the above changes for the next client review.
10. **Add Examiner Management:** Create UI for Course Admins to add/manage examiners associated with their course (including setting the assessment session limit per examiner).

## **6\. Next Steps**

- The team will revise the prototype and affected documentation based on the extensive feedback.
- The team will begin implementing agreed-upon features that are not blocked by the major pivots (while refining the pivoted designs).
- Another client meeting will be scheduled in **2-3 weeks** (team to confirm timeline) to review the refined prototype and ensure alignment before significant development on the pivoted features begins.
