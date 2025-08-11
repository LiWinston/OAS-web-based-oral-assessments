# Meeting Minutes: Client Meeting - Oral Assessment Booking System

## Date: 20/03/2025

## Attendees:

- Client: Hasti Samadi
- Team Members: All Team Members and Mentor Geela

## Agenda

1. User Flow and Feature Description
2. Level of Customization for Feedback and Rubrics
3. Student Booking Experience
4. Examiner Experience
5. Canvas Integration
6. Technical Stack and Platform
7. Data Security
8. System Testing and Feedback

## Meeting Notes

### 1. Current System and Integration Requirements

- No current system exists; currently using Excel files, groups on LMS
- Open to integration with existing third-party systems (e.g., Outlook Calendar)
- Goal is to create a system that is easy to maintain in the future

### 2. Customization for Marking Rubrics

- Rubrics should be fully customizable following the current LMS marking system
- Multiple criteria with subcriteria (flexible hierarchy)
- Each criterion can have various marking options:
  - Specific marks (e.g., 0, 0.5, 1)
  - Range of marks
  - Different marking scales (numbers, letters, etc.)
- Admin should be able to define if criteria apply to individuals or groups
- System should support pre-defined comments that examiners can select from

### 3. Admin Workflow

- Admin sets up:
  - Year, semester, subject
  - Assignments (individual or group)
  - Marking rubrics (group and individual)
  - Available timeslots for examiners
  - Upload student/group data from LMS via CSV files
- Admin should be able to update student and group data
- Admin can generate mark and feedback CSV files to upload back to Canvas

### 4. Student Workflow

- Students sign in using a secure system (not necessarily SSO)
- Students can view their group members (if group assignment)
- Students cannot change their assigned groups
- Any student from a group can book a timeslot for the entire group
- Students receive booking confirmation emails and reminders
- Students can see their marks and feedback after assessment
- Students cannot reschedule appointments within 24 hours of the booked timeslot

### 5. Examiner Workflow

- Examiners can assign themselves to timeslots
- Multiple examiners can be assigned to one slot
- System prevents examiners from being double-booked
- Examiners mark independently using the rubric
- Marks from one examiner should not be visible to other examiners (but visible to admin)
- Marking interface should be user-friendly with minimal page navigation
- Combined group and individual marking should be on the same page

### 6. Canvas Integration

- Import student data and group information from Canvas (CSV import)
- Export marks and feedback to Canvas (CSV export)
- Integration with Canvas UI is not a priority

### 7. Technical Requirements

- Web-based application, primarily for desktop with mobile/tablet adaptation
- Security is essential due to sensitive student data
- Privacy policy agreement page for students
- Consider integration with third-party microservices for rubric and calendar functionality

### 8. Testing and Deployment

- Testing approach: team testing → mentor testing → client testing → stakeholder testing
- Client open to testing the system in a real class environment
- Hosting and deployment details to be discussed later
- Client will check if university hosting services are available

### 9. Action Items

1. Client to provide:

   - Example CSV files for student and group data from Canvas
   - Required output format for marks CSV
   - Information about possible third-party microservices to integrate
   - Preferences for hosting and deployment

2. Team to:
   - Research existing microservices for rubrics and scheduling
   - Create a detailed project plan
   - Schedule follow-up meetings

## Next Meeting

To be scheduled
