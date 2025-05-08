# Sprint 2 Retrospective

## Sprint Overview

**Duration:** Week 5 - 8 (30/03/2025 - 20/04/2025)

## 🌟 What Went Well

1. **Communication with Client**
   - Thorough preparation for client meetings, enabling more efficient meeting proceedings
   - Detailed meeting minutes documentation facilitates team members' review and clear understanding of the current project status
   - Timely communication with the client enables faster identification and resolution of issues
2. **Documentation Quality**
   - Visually appealing and intuitive high-fidelity prototypes that enhance user experience
   - Clear architecture diagrams that effectively show the system structure
   - Extensive documentations that present both the system design and solution
3. **Github Process Control**
   - Standardized Pull Requests before merging help the team conduct reviews and prevent most merge errors
   - Team members demonstrated strong engagement during the Pull Request process, with everyone actively participating in reviews and offering their suggestions
   - Well-structured issue tracker clearly shows the current progress of each part of project.

## 🔄 What Could Be Improved

- Have pre-meeting agenda and time boxing for discussion topics to improve meeting efficiency.
- We can implement structured participation techniques during planning and retrospective sessions to ensure all team members' perspectives are heard

## 🎯 Action Items for Next Sprint

1. **Restructure Admin Roles:** Implement the hierarchical two-tier admin framework (Super Admin, Course Admin) with corresponding permission controls and interface views.
2. **Revise CSV Handling:** Relocate student/group CSV import/update functionality to the *assignment* level. Optimize data overwriting/updating processes.
3. **Enhance Rubric Creation Tool:**
   - Develop fully customizable performance levels (quantity, terminology, manual mark entry).
   - Enable flexible addition/removal of levels for each criterion.
   - Relocate predefined comment management to be *per criterion* within the rubric builder.
   - Create functionality for examiners to contribute to the shared comment library during evaluation.
4. **Develop Custom Scheduling Solution (In-House):**
   - Design Admin interface for configuring detailed time slots (duration, venue, examiner count required, assessment session count).
   - Enable simultaneous/concurrent time slot functionality.
   - Build Examiner interface to view specific, detailed time slots and *self-assign* to available slots.
   - Create Admin controls to regulate the number of *assessment sessions* per examiner.
   - Construct backend logic for managing slot availability based on examiner assignments.
5. **Develop Custom Scheduling Solution (In-House):**
   - Design Admin interface for configuring detailed time slots (duration, venue, examiner count required, assessment session count).
   - Enable simultaneous/concurrent time slot functionality.
   - Build Examiner interface to view specific, detailed time slots and *self-assign* to available slots.
   - Create Admin controls to regulate the number of *assessment sessions* per examiner.
   - Construct backend logic for managing slot availability based on examiner assignments.
6. **Improve Examiner Marking Interface:**
   - Incorporate criterion-specific predefined comment selection/addition.
   - Assess practicality of list view versus tabbed/dropdown view for individual student assessment.
   - Make 'Notes' section visible to Administrators. Eliminate/repurpose the 'Feedback' tab.
7. **Create Administrative Reporting:** Implement three essential reports: Scheduling Overview, Mark Results/Aggregation (with avg/min/max selection), and Examiner Marking Trends (real-time).
8. **Update Documentations:** Revise all affected user stories, acceptance criteria, and design documents to reflect these changes.
9. **Update Hi-Fi Prototype:** Refresh the Figma prototype to incorporate all above modifications for next client review.
10. **Implement Examiner Management:** Develop interface for Course Admins to add/manage examiners for their courses (including configuring assessment session limits per examiner).

## Next Steps

1. The team will revise the prototype and affected documentation based on the extensive feedback.
1. The team will begin implementing agreed-upon features that are not blocked.
