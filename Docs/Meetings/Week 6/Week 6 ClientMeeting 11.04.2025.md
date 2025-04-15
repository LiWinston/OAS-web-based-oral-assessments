# Meeting Minutes: Client Meeting - Oral Assessment Booking System

## Date: 15/04/2025 4 pm - 5pm

## Attendees:

- Pseudo Client: Geela (standing in for Hasti who is ill)
- Team Members: Ian Chi, Haocheng Li

## Agenda

1. Project Progress Update
2. Project Scope Review
3. User Stories and Epics Review
4. Prototype Demonstration
5. Discussion on System Features
6. Next Steps and Action Items

## Meeting Notes

### 1. Project Progress Update

- Team presented progress on initial planning and documentation
- Shared timeline plan, requirements, and user stories
- Mentioned the in-progress first report being prepared

### 2. Project Scope Review

#### In-Scope Features Reviewed:

- **User Account Management**:

  - Three user roles: Student, Examiner, and Administrator
  - Clarified that Examiner refers to tutors/markers, Administrator refers to course coordinators
  - Discussed the possibility of multiple administrators per course (especially for larger subjects)
  - Confirmed that student accounts will be created based on CSV data import

- **Assessment Configuration**:

  - Setting up academic year, creating assessments, defining marking scales
  - Administrator can create courses and configure assessments under courses
  - Designing customizable marking rubrics with flexible criteria structure

- **Scheduling and Booking**:

  - Administrator defines assessment time slots
  - Students book slots individually or as groups
  - System supports rescheduling with appropriate restrictions
  - Examiners can set availability for assessments

- **Assessment Execution**:

  - Interface for examiners to view assessment schedules
  - Tools for recording individual and group feedback
  - Support for predefined comments to ensure consistent feedback
  - Capability to save progress during marking

- **Marking Management and Reporting**:

  - Calculate marks based on rubric criteria
  - Control over when results are visible to students
  - Students access their marks and feedback after release
  - Export marks and feedback in Canvas-compatible format

- **Integration with Canvas LMS**:

  - CSV import/export functionality
  - Ability to update student data (for late enrollments or withdrawals)

- **Notification System**:

  - Email confirmations for bookings and assessment reminders
  - System notifications for account-related activities

- **System Security and Compliance**:
  - Privacy policy agreement for users
  - Audit logging for significant system actions

#### Out-of-Scope Features Confirmed:

- No single sign-on (SSO) integration with university authentication system
- No direct API with university management system
- No mobile application
- No advanced analytics and reporting features
- No automated grading or AI-assisted assessment
- No live video assessment capability

### 3. User Stories and Workflow

Reviewed key user stories organized by epics:

- **CSV Import/Export**:

  - Administrator can upload and re-upload student data via CSV
  - Administrator can preview changes before overriding data
  - Administrator can export mark and feedback data for Canvas

- **User Account Management**:

  - Students receive email notifications for registration
  - Users can securely log in with password
  - Password reset functionality
  - Administrator can manage user accounts

- **Assessment and Feedback**:

  - Examiners can view assessment schedules and registered users
  - Examiners can provide individual and group feedback
  - Examiners can select from predefined comments
  - Examiners can save progress during marking

- **Assessment Configuration**:

  - Administrator can set up academic periods
  - Administrator can create assignments linked to subjects
  - Administrator can create customizable marking rubrics
  - Administrator can define flexible marking options

- **Booking System**:

  - Administrator can define available time slots
  - Students can view and book available slots
  - Students can reschedule (with appropriate restrictions)
  - System prevents concurrent booking issues

- **Marking Management**:

  - System to calculate marks based on rubric criteria
  - Support for negative marking options in rubrics
  - Administrator can control when results are visible to students

- **Notifications**:
  - Users receive appropriate notifications for bookings, rescheduling
  - System sends reminders before scheduled assessments

### 4. Prototype Demonstration

- Haocheng demonstrated a prototype showing the administrator workflow:
  - Creating a course
  - Creating an assignment within that course
  - Configuring assessment settings
  - The planned workflow for defining rubrics

### 5. Key Discussions and Decisions

1. **Multiple Administrators**:

   - Agreed to allow multiple administrators per course
   - Important for large subjects with multiple coordinators

2. **Student Data Management**:

   - Need to support updating student data after initial import
   - Critical for handling late enrollments and withdrawals
   - Administrator should be able to re-upload CSV data

3. **Booking System Design**:

   - Taking inspiration from Calendly for booking functionality
   - Discussed whether to build custom solution or use existing APIs
   - Need to explore API options versus building custom solution

4. **Marking System**:

   - Support for negative marking in rubrics
   - Need to handle minimum mark of zero (even if calculations result in negative)
   - Support for different marking components for groups vs individuals

5. **Examiner Notifications**:
   - Need to avoid overwhelming examiners with notifications
   - Consider summary notifications rather than individual booking notifications

### 6. Action Items

Team to:

- Update user stories based on feedback
- Research booking system API options
- Complete prototype development
- Prepare for meeting with Hasti upon her return

## Next Meeting

- To be scheduled when Hasti returns (around April 28th)
- Team to email documentation to Hasti and arrange next meeting
