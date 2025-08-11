# Client Meeting Minutes

**Date:** August 11, 2025  
**Time:** 11:30 AM - 12:30 PM  
**Meeting Type:** Project Progress Review and Demo  
**Project:** Oral Assessment System (OAS)

## Attendees

**Client Representatives:**
- Hasti Samadi (Primary Client)
- Geela Chee (Project Coordinator)

**Development Team:**
- Ian CHI (Product Owner)
- Haocheng Li (Frontend Developer - Demo Presenter)

## Meeting Objectives

The meeting was convened to present current project progress, demonstrate frontend development achievements, discuss implementation timeline, and align on next phase deliverables and testing approach.

## Project Progress Update

Ian CHI provided a comprehensive overview of development progress since the previous semester. The team has successfully transitioned from HTML prototypes to a fully functional Next.js framework implementation. This transition represents a fundamental shift from static design mockups to interactive, backend-integrable frontend components.

The current development status encompasses four primary user interface categories: administrative dashboard, super admin interface, examiner interface, and student interface. Administrative dashboard development has reached approximately fifty percent completion, with core feature pages implemented while certain subpages, including time slot management, remain in development. The super admin dashboard has achieved full completion from a frontend perspective, though backend integration requirements remain outstanding.

Backend development has established foundational systems including core authentication functionality with login and registration capabilities, email notification services, and CSV data import functionality with database integration. The team has prioritized developing these core systems to support frontend integration activities.

## Frontend Demonstration

Haocheng Li conducted a detailed demonstration of the implemented frontend interfaces. The demonstration showcased the super admin login process, which requires manual URL navigation due to security considerations for this highly authorized user role. The super admin dashboard displays comprehensive system overview information, course administrator management capabilities, and quick action functionality for primary administrative tasks.

The super admin interface includes course administrator invitation functionality, allowing system administrators to invite new course administrators by entering credentials and departmental information. The system generates email invitations through backend integration, though current frontend-backend integration limitations prevent full end-to-end functionality demonstration.

The course admin dashboard provides comprehensive course management capabilities including course creation, assignment configuration, and assessment calendar integration. The demonstration highlighted the assignment creation workflow, which includes three-stage configuration processes requiring CSV file import for student and group data.

A significant feature demonstrated was the rubric configuration system, which supports customizable performance levels with adjustable scales and predefined comment libraries. The system allows course administrators to add, modify, and remove performance levels while managing criterion-specific feedback comments.

## Technical Challenges and Solutions

Ian CHI identified current integration challenges between frontend and backend systems. The team has encountered deployment and coordination difficulties that impact development velocity. The backend team's preference for maintaining their existing Spring Boot framework rather than adopting a full-stack Next.js approach has created integration complexities requiring additional coordination protocols.

To address these challenges, the team has implemented revised workflow processes with enhanced testing procedures. Backend team leaders now validate API functionality before integration, while dedicated QA team members focus on frontend-backend integration testing and edge case validation. Ian CHI, as Product Owner, conducts final feature validation against established user stories.

## Timeline Discussion and Planning

The current development timeline projects administrative interface completion within three weeks, followed by two weeks for examiner interface development and three weeks for student interface implementation. Ian CHI emphasized that the administrative interface represents the most complex development phase due to extensive feature requirements and backend integration needs.

Hasti Samadi expressed preference for iterative delivery approach, requesting that individual features be completed and made available for testing while other features remain in development. This approach would enable early validation of core functionality such as authentication, booking systems, and marking capabilities.

The timeline discussion revealed that the project has extended deadline flexibility, with final submission scheduled for November 7th rather than traditional semester end dates. This extended timeline provides additional development and testing opportunities.

## Client Feedback and Requirements

Hasti Samadi provided specific feedback regarding CSV file management functionality. She suggested implementing an option to reuse previously uploaded CSV files from earlier assignments within the same course, rather than requiring new uploads for each assignment. This enhancement would streamline workflow for course administrators when student enrollment remains unchanged between assignments.

The client emphasized the importance of functional testing with real users, expressing interest in organizing focus group testing with actual students to validate system usability and functionality. However, Geela Chee noted potential ethical approval requirements for student involvement in testing activities.

## Testing Strategy and Validation

Discussion of testing approaches revealed institutional constraints regarding student participation in system validation. While direct student testing may require ethical approval processes, alternative testing strategies involving course coordinators and tutors were identified as viable approaches.

The team agreed to structure development cycles to produce testable functionality at regular intervals, enabling iterative validation and feedback incorporation. This approach supports continuous improvement while maintaining development momentum.

## Action Items and Next Steps

Ian CHI committed to revising the project timeline to incorporate iterative delivery cycles that produce testable functionality at regular intervals. The revised timeline will prioritize minimum viable product delivery for core features to enable early testing and validation.

The development team will implement the suggested CSV file reuse functionality as an enhancement to the assignment creation workflow. This feature will include dropdown selection of previously uploaded files within the same course context.

Timeline revision will focus on delivering a complete administrative interface within three weeks, followed by basic examiner functionality within one additional week, and fundamental student interface capabilities within another week. This five-week cycle will produce the first fully functional system iteration suitable for comprehensive testing.

## Future Meeting Schedule

The next client meeting will be scheduled following completion of the administrative interface features, enabling demonstration of fully functional administrative capabilities. Ian CHI will provide the revised timeline document to facilitate optimal meeting scheduling coordination.

Hasti Samadi noted increasing schedule constraints for the current semester and requested advance timeline documentation to ensure appropriate meeting coordination and availability.

## Meeting Conclusion

The meeting concluded with mutual agreement on development priorities, testing approach, and timeline revision requirements. The client expressed satisfaction with current progress while emphasizing the importance of functional delivery and iterative testing opportunities.

The development team demonstrated clear understanding of client requirements and technical constraints, with committed action items addressing identified enhancement opportunities and timeline optimization needs.
