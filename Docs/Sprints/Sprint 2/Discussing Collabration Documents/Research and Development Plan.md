# Research and Development plan

The OAS platform requires a carefully integrated system that balances three core components: booking functionality, assessment/marking capabilities, and administrative configuration.

### **1. Booking & Scheduling System (Core)**

The booking component is central to user experience, particularly for students. 
 Some Essential Features involves:

·     Time slot definition and management

·     Venue allocation

·     Individual and group booking mechanisms

·     Scheduling conflict prevention

·     Rescheduling capabilities (with constraints)

·     Examiner self-assignment

### **2. Assessment & Marking System**

The assessment component essential features consists:

·     Provides structured feedback collection

·     Enables rubric-based assessment

·     Supports both individual and group evaluation

·     Facilitates mark calculation and aggregation

·     Manages result publication and visibility

### **3. Configuration & Administrative System**

The configuration component underpins the entire platform by:

·     Establishing academic periods and subject structures

·     Defining assessment parameters and rubrics

·     Managing user accounts and access controls

·     Handling data import/export with Canvas

·     Controlling assessment scheduling parameters

## Some Existing applications Comparative analysis

### Canvas Scheduler(https://www.youtube.com/watch?v=Ovjv_DAp7Tc)

**Strengths with Examples:**

·     **Native LMS Integration:** Students access scheduling directly from their course dashboard without separate login, maintaining consistent user context.

·     **Appointment Groups:** Instructors can create specific appointment blocks (e.g., "Week 3 Oral Assessments") with defined time slots.

·     **Attendance Tracking:** Automatically records student attendance for scheduled appointments.

**Limitations with Examples:**

·     **Group Booking Constraints:** Groups must be pre-defined in Canvas, and the system doesn't handle one member booking on behalf of the entire group.

·     Not straight forward and not user friendly to use.

The Canvas appointment calendar view provides a clean way to visualize availability that our system could adapt while enhancing it with group-specific functionality.

### Doodle Scheduling(https://doodle.com/en/)

**Strengths with Examples:**

·     **Visual Availability Interface:** Uses color-coded grid showing available/unavailable times across potential participants.

·     **Polling Mechanism:** Allows group members to indicate preferred times before finalizing (e.g., all team members mark their availability before confirming an oral presentation slot).

·     **Integration Capabilities:** Connects with calendar systems (Google, Outlook) to check existing commitments.

**Limitations with Examples:**

·     **No Controlled Allocation:** First-come, first-served approach without rules-based allocation (can't limit students to one booking per assessment period).

·     **Lack of Assessment Context:** No way to attach assessment criteria or preparation instructions to booking slots.

·     **No Authentication Framework:** Doesn't verify university credentials or restrict access based on course enrollment.

Doodle's availability visualization could inform how oursystem displays time slot availability to groups, showing when all examiners and venues are available.

### Calendly (https://calendly.com/)

**Strengths with Examples:**

·     **Advanced Availability Rules:** Allows setting complex availability patterns (e.g., "only Tuesday afternoons" or "3 slots per day maximum").

·     **Buffer Time Management:** Automatically adds preparation time between sessions (e.g., 10-minute gaps between student presentations).

·     **Automated Communication Workflow:** Sends confirmation emails, reminders at defined intervals (24 hours, 1 hour before), and follow-ups. 

**Limitations with Examples:**

·     **Limited Educational Context:** No concept of courses, assignments, or academic periods that structure university assessments.

·     **Basic Group Handling:** While allowing multiple attendees, lacks specific controls for academic group assessments (e.g., ensuring all group members are registered for the same course).

·     **No Assessment Tools:** No capability to record scores or structured feedback during the scheduled session.

Calendly's reminder system could be adapted to send customizable notifications to students with assessment-specific preparation instructions at strategic intervals before their oral assessment.

###  WCOnline (Writing Center Scheduling https://mywconline.com/)

**Strengths with Examples:**

·     **Education-Specific Interface:** Form fields capture course information, assignment details, and specific help needed for each appointment.

·     **Resource Allocation:** Matches students with appropriate tutors based on subject expertise and availability.

·     **Recurring Appointment Support:** Facilitates ongoing assessment relationships (e.g., weekly language proficiency evaluations).

**Limitations with Examples:**

·     **Limited Assessment Structure:** While it captures notes, it lacks formal rubric-based evaluation frameworks required for graded assessments.

·     **Narrow Focus:** Optimized specifically for writing center tutoring rather than formal oral assessments (presentation skills, language proficiency, vivas).

·     **Limited Reporting:** Basic usage statistics but insufficient academic performance analytics.

WCOnline's approach to collecting pre-appointment information could inform how our system gathers context before an oral assessment (e.g., presentation topic, group members, specific preparation notes for examiners).

### Gradescope (https://www.gradescope.com/)

**Strengths with Examples:**

·     **Structured Grading Workflow:** Guides examiners through assessment criteria systematically, ensuring complete evaluation.

·     **Question-level Rubrics:** Allows different rubric structures for different components of an assessment.

·     **Statistical Analysis:** Provides distributions and comparisons across student performance on specific criteria.

**Limitations with Examples:**

·     **Batch Processing Model:** Designed for assessing many submissions against the same criteria rather than individual real-time assessments.

·     **Limited Real-time Capabilities:** Interface not optimized for capturing feedback during a live oral assessment.

·     **No Scheduling Integration:** Separate from the appointment booking process.

**Relevance Example:** Gradescope's approach to rubric application could inform how oursystem structures the examiner's assessment interface, particularly the ability to view criteria descriptions while inputting scores.

### Acuity Scheduling (https://acuityscheduling.com/scheduling-solutions?utm_source=adwords&utm_medium=cpc&utm_campaign=branded&utm_term=em&utm_content=au&gad_source=1&gclid=CjwKCAjwwLO_BhB2EiwAx2e-3z0Ne58j1nQbszu-f5Yjs2nikIGC8mbPImKihElxHSj85HlNpIdwwhoCgU8QAvD_BwE&gclsrc=aw.ds)

**Strengths with Examples:**

·     **Custom Intake Forms:** Collects specific information at booking time (could gather presentation topics or group member details).

·     **Location Management:** Handles multiple physical venues with different availability patterns.

·     **Payment Integration:** Could be adapted for special assessment scenarios requiring fee payment.

**Limitations with Examples:**

·     **No Academic Framework:** Lacks course/assignment structure and institutional context.

·     **No Assessment Capabilities:** Focused solely on appointment management without evaluation tools.

·     **Limited Institutional Controls:** Insufficient administrative oversight for academic integrity requirements.

**Relevance Example:** Acuity's intake forms could inspire how our system collects preparation information from students when they book assessment slots, prompting them for presentation topics and special requirements.

## Feedback Fruits (https://feedbackfruits.com/)

**Strengths with Examples:**

·     **Peer Assessment Capabilities:** Supports multi-directional feedback including peer evaluation components.

·     **Multimedia Assessment:** Designed for evaluating presentations and video submissions.

·     **LMS Integration:** Embeds directly within Canvas and other learning platforms.

**Limitations with Examples:**

·     **Limited Scheduling:** Strong on assessment but weak on appointment management.

·     **Complex Setup:** Requires significant configuration for each assessment type.

·     **Synchronous Limitations:** Better suited to asynchronous recorded presentations than live oral assessments.

## Phased Implementation Plan
 **Phase 1: Configuration Foundation**

·     Implement basic subject/assignment setup

·     Create user authentication and role management

·     Establish Canvas data import capabilities

·     Develop initial rubric definition tools 

**Phase 2: Booking System Core**

·     Build time slot and venue management

·     Implement individual and group booking mechanisms

·     Create booking confirmation and management interfaces

·     Develop examiner assignment capabilities

**Phase 3: Assessment Functionality**

·     Build assessment interface with rubric application

·     Implement feedback collection mechanisms

·     Create mark calculation and aggregation tools

·     Develop results publication controls

**Phase 4: Integration Refinement**

·     Enhance Canvas import/export capabilities

·     Implement notification system

·     Add reporting and analytics features

·     Refine user experiences based on testing

## **Technical Focus Areas**

·     **Data Consistency:** Ensure data integrity across booking and assessment processes

·     **Concurrency Management:** Handle simultaneous booking attempts effectively

·     **Role-Based Access Control:** Implement robust permissions system

·     **Responsive Design:** Ensure accessibility across devices

·     **API Architecture:** Design for potential future integrations


Database Design Constraint (Raised by Nemo)

Each occupied and utilized timeslot should be linked to the student's record before assigning grades.
