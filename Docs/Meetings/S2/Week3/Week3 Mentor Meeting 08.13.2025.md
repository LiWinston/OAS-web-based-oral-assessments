# Meeting Minutes - OAS Project Team Meeting

**Date:** 13 August 2024  
**Time:** 16:00 - 17:00  
**Meeting Type:** Mentor Meeting

## Attendees
All team members  
*Note: Dongqiao He joined late*

## 1. Endeavor Event Registration and Requirements

Geela Chee outlined the requirements for the upcoming Endeavor event participation. The team registration form must be completed today with the "Save my response to edit" option selected. The project code should be listed as "OAS" and Nemo has been designated as the team leader contact point for Endeavor communications. Mobile numbers are required for risk and safety purposes.

Several upcoming Endeavor activities were discussed. The student photoshoot is optional but recommended for teams without existing photos. The risk workshop is compulsory and at least one team member must attend. The poster design workshop is optional but recommended for whoever will be designing the team poster. Award applications require active submission as teams are not automatically considered for awards.

Important client coordination requirements were emphasized. Husty, the client, must be invited to the event. The team needs to coordinate with Husty regarding booth design, promotional materials, and any handouts she may want distributed. Poster design and booth materials require client approval as the display represents her product.

## 2. Individual Progress Updates and Technical Challenges

The testing team, consisting of Ben Yuan and Breanne, has completed research and documentation for the testing plan. They have created test cases for CSV import functionality and Super Admin features and are ready to begin API testing once backend deployment is complete. They will coordinate with Nemo for deployment testing procedures.

Backend development progress shows significant advancement. Yun Chen has completed Epic 9 Super Admin Management implementation and Epic 2 User Account Management features including authentication and email functionality. Epic 4 work has been redistributed due to task coordination issues with Dong Chao. Wang Xiang has completed Epic 4.1 academic period setup and identified that Epic 4 user stories must be implemented sequentially rather than in parallel, as Epic 4.2 depends on 4.1 completion. He will collaborate with Dong Chao on remaining Epic 4 stories.

Frontend development progress includes Casper completing Super Admin UI implementation with mock APIs. He has identified integration challenges requiring immediate resolution and made modifications to navigation and interface components. He is ready to begin backend integration. Yuin has reviewed the frontend codebase as a new team member, successfully set up the local development environment, and will work on time slot management pages following Epic 5 requirements.

## 3. Critical Technical Integration Issues

A significant discussion emerged regarding development workflow bottlenecks. The current process requires backend deployment before frontend integration testing, and small backend changes necessitate full redeployment, causing substantial delays. The team identified the need for virtual environment setup to enable parallel development.

Immediate technical solutions were identified. Nemo will conduct a training session for all team members on virtual environment configuration. Both frontend and backend teams must install and configure development environments, as this setup is critical for enabling parallel development and reducing waiting time. Backend and frontend teams need established procedures for rapid iteration, API documentation must be kept current to support integration work, and Swagger documentation will be provided for implemented APIs.

## 4. Sprint Planning and Deadlines

Current sprint goals are due by the end of the week on Friday. The Epic 4 team, consisting of Wang Xiang and Dong Chao, must complete the first three user stories of Epic 4 by Friday, focusing on core administrative functionality backbone with API endpoints and reasonable data passing required for frontend integration.

Frontend integration work involving Casper and Yun Chen must include Super Admin and login registration integration with backend, with Epic 2 and Epic 9 functionality fully connected while monitoring progress of other frontend team members.

Backend deployment requirements include Epic 1 Data Import and Export, Epic 2 User Management, Epic 4 Assessment Configuration, and Epic 9 Super Admin APIs must be deployed with real-time change support implementation required.

Ian raised concerns about the effectiveness of story point estimation for the project, noting that many critical tasks such as integration, deployment, and testing are not captured in GitHub issues. Story point estimation does not reflect actual work distribution, and administrative overhead is reducing development time. Geela agreed to consider alternative approaches that better capture actual work contribution while maintaining accountability.

## 5. Assessment and Presentation Requirements

Several upcoming academic requirements were discussed. Progress Assessment 1 is due next Friday, and the midterm presentation is scheduled for Week 6 during workshop time. Approximately half the team will present at midterm with the remainder presenting at the final presentation. All team members must present at either the midterm or final session.

The team expressed concerns about balancing development work with academic presentation requirements, noting that significant time was spent on documentation in the previous semester rather than product development.

## 6. Stand-up Session Summary

Each team member provided brief updates on completed work and commitments for the following week. Key focus areas for next week include virtual environment setup and training for all team members, backend-frontend integration work involving Casper, Yun Chen, and Nemo, Epic 4 team coordination and completion with Wang Xiang and Dong Chao, testing plan implementation by Ben Yuan and Breanne, and time slot management UI development by Yuin.

## Action Items

### Immediate (Today/This Week)
- Nemo: Complete Endeavor team registration form
- All team members: Set up virtual environment following Nemo's guidance
- Nemo: Conduct virtual environment training session for all team members
- Epic 4 team: Hold coordination meeting to divide remaining user stories
- Ian: Develop alternative project management approach to replace story points

### By End of Week (Friday)
- Wang Xiang, Dong Chao: Complete first three Epic 4 user stories with functional APIs
- Casper: Complete Super Admin and authentication frontend-backend integration
- Yun Chen: Support integration testing and address backend issues identified
- Testing team: Begin API testing once integration environment is available

### Ongoing Coordination
- All team members: Coordinate with Husty regarding Endeavor event booth design and materials
- Ian: Prepare meeting minutes and distribute to team
- Geela: Consider alternative project management approaches for better work tracking

## Next Meeting

Geela will rejoin the team at 18:30 for continued coordination discussions. The immediate session will focus on virtual environment setup training and team coordination for Epic 4 and integration work.

---
*Meeting concluded at 17:00 with team members remaining for technical coordination sessions.*