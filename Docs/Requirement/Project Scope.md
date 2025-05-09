# Project Scope Statement

## In Scope

The Oral Assessment System (OAS) will include the following capabilities:

1. **User Account Management**

   - Creation and management of student, examiner, and administrator accounts
   - Secure authentication through password-based and email verification methods
   - Role-based access control to system features

2. **Assessment Configuration**

   - Setup of academic periods (year, semester, subject)
   - Creation of assignments with individual or group designations
   - Configuration of customizable marking rubrics with hierarchical criteria
   - Definition of various marking scales for different criteria

3. **Scheduling and Booking**

   - Administrator definition of assessment time slots and venues
   - Student booking of assessment slots (individual or group)
   - Rescheduling capabilities (with appropriate time restrictions)
   - Examiner self-assignment to assessment slots

4. **Assessment Execution**

   - Interface for examiners to view their assessment schedule
   - Tools for recording individual and group feedback
   - Support for predefined comments to ensure consistent feedback
   - Capability to save draft assessments and submit final marks

5. **Mark Management and Reporting**

   - Calculation and aggregation of marks based on rubric components
   - Control over when results are visible to students
   - Student access to their marks and feedback after release
   - Export of marks and feedback in Canvas-compatible format

6. **Integration with Canvas LMS**

   - Import of student and group data via CSV files
   - Export of assessment results via CSV files for upload to Canvas

7. **Notification System**

   - Email confirmations for bookings
   - Assessment reminders for students and examiners
   - System notifications for account-related activities

8. **System Security and Compliance**
   - Privacy policy agreement for students
   - Audit logging of significant system actions

## Out of Scope

The following items are explicitly excluded from the project scope:

1. **Direct Integration with University Systems**

   - No direct API integration with university student management systems
   - No single sign-on (SSO) integration with university authentication systems

2. **Mobile Application Development**

   - The system will be web-based with responsive design, but no dedicated mobile apps will be developed

3. **Advanced Analytics and Reporting**

   - While basic reporting will be included, advanced analytics and data visualization tools are out of scope

4. **Automated Grading or AI-Assisted Assessment**

   - The system will not include AI tools for automated assessment or grading assistance

5. **Live Video Assessment Capabilities**

   - The platform will not include built-in video conferencing for remote assessments

## Project Constraints

1. **Technical Constraints**

   - The system must be web-based, primarily for desktop with mobile/tablet adaptation
   - Data exchange with Canvas will be limited to CSV file imports and exports

2. **Time Constraints**

   - The project must be completed within the academic timeline in 2 semesters
   - Testing and implementation phases must align with university term schedules (The Winter Holiday will not be included)
3. **Resource Constraints**

   - Development must be accomplished with the allocated team size and skill set
   - No third-party commercial services requiring ongoing subscription fees should be utilized (University Policies, open source is better)
4. **Security and Privacy Constraints**

   - The system must comply with university data protection policies
   - Student data must be handled securely and in compliance with privacy regulations
   - Authentication systems must meet university security standards

5. **Integration Constraints**

   - Integration with Canvas is limited to data exchange via CSV files
   - No direct API integrations with university systems are available

6. **Operational Constraints**
   - The system must be maintainable by future university staff or development teams
   - Documentation must be comprehensive to support future maintenance