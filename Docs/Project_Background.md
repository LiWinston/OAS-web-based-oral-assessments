# Project Background

## Overview

Oral assessments are a crucial part of student evaluation, offering opportunities to assess not just academic knowledge, but also communication and reasoning skills. However, the current practices for managing these assessments are often manual, fragmented, and inefficient. This project proposes the development of a unified, web-based platform aimed at streamlining the oral assessment lifecycle: from scheduling and preparation, through to the assessment itself, and the final mark collation and feedback delivery.

The platform is designed to serve students, examiners, and administrators, providing distinct, role-specific interfaces and tools to facilitate each stage of the assessment process. Through features like booking systems, feedback capture tools, and automated mark aggregation, the platform aims to significantly reduce administrative burden, enhance transparency, and ensure consistency in how oral assessments are managed and evaluated.

## Problem Statement

1. **Inefficient Scheduling Systems**  
   Current scheduling practices for oral assessments rely on manual coordination between students and staff, leading to scheduling conflicts, missed sessions, and administrative confusion. There is no centralised platform that supports both individual and group bookings in a controlled, conflict-free manner.

2. **Lack of Structured Feedback Mechanisms**  
   Feedback is often delivered inconsistently, varies across examiners, and is difficult to manage or retrieve after assessments. There is no standard interface or rubric management system to ensure feedback is constructive, uniform, and well-documented.

3. **Manual Mark Consolidation and High Risk of Error**  
   Marks for both group and individual assessments are typically consolidated manually, resulting in high chances of miscalculation and data entry errors. This also imposes unnecessary workload on academic and administrative staff, slowing down the result release process.

4. **Limited Integration with Learning Management Systems**  
   Data entry duplication occurs because student details and assessment results have to be manually transferred between assessment records and systems like Canvas. This redundant process creates room for data inconsistency and inefficiencies in grade processing.

## Context and Motivation

The University of Melbourne and other higher education institutions are increasingly incorporating oral assessments into their evaluation strategies. While pedagogically valuable, these assessments place a significant logistical burden on both teaching and administrative staff. Additionally, students often find the current systems lacking in clarity, transparency, and flexibility.

This platform is developed to address these challenges. By automating core processes—scheduling, structured feedback, and mark consolidation—and integrating with existing learning platforms such as Canvas, it enables a seamless and efficient assessment experience for all parties involved.

The system aligns with modern educational values such as fair and transparent evaluation, scalability, and data integrity. It also accommodates diverse assessment types (individual and group), different visibility requirements (e.g., independent marking), and university-level privacy and compliance standards.

## Goals and Vision

The platform aims to:

- **Streamline Scheduling:** Provide a controlled, conflict-free booking system with venue allocation and optional reminders.
- **Support Structured Feedback:** Enable customizable rubrics and feedback templates, tailored per subject or assessment.
- **Automate Mark Aggregation:** Automatically consolidate marks and feedback for both individual and group components.
- **Enable Seamless Integration:** Import and export Canvas-compatible CSV files to eliminate duplication and reduce administrative overhead.
- **Enhance User Experience:** Offer role-based interfaces with intuitive navigation for students, examiners, and administrators.

By implementing this solution, the project will improve the overall efficiency, transparency, and reliability of oral assessment administration across the institution.

## Project Scope Statement

### In Scope

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

### Out of Scope

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
   - No third-party commercial services requiring ongoing subscription fees should be utilized(University Policies, Opensource is better)

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

## Risk Analysis

| Risk Category           | Risk Description                                                                                              | Probability | Impact | Mitigation Strategy                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data Exchange**       | CSV file import/export with Canvas may encounter format incompatibilities or data inconsistencies             | High        | High   | Confirm CSV formats with client in advance; implement comprehensive validation; create detailed documentation for import/export processes                          |
| **Data Privacy**        | Sensitive student information could be improperly accessed or exposed                                         | Medium      | High   | Implement strict role-based access control; ensure secure data storage; provide privacy policy for student consent; limit data access to authorized personnel only |
| **Authentication**      | Without SSO integration, password management and user authentication may present security challenges          | Medium      | Medium | Implement secure email verification; use strong password policies; provide password reset functionality; consider alternative authentication methods               |
| **System Adoption**     | Users may resist adopting the new system if it's perceived as complex or difficult to use                     | Medium      | High   | Focus on intuitive UI/UX design; provide comprehensive user documentation; implement gradual rollout with feedback loops                                           |
| **Testing Environment** | Limited access to real-world testing environments may result in undetected issues                             | High        | Medium | Implement thorough theoretical testing; use progressive testing approach (team → mentor → client → stakeholders); document all testing limitations                 |
| **Concurrent Usage**    | System may experience performance issues during peak booking periods when many students access simultaneously | Medium      | High   | Implement efficient database design; incorporate booking queuing mechanisms; conduct load testing prior to full deployment                                         |
| **Mark Calculation**    | Complex rubric structures and marking algorithms may lead to calculation errors                               | Medium      | High   | Implement comprehensive unit testing for all calculation algorithms; provide mark review capabilities for administrators                                           |
| **System Maintenance**  | Future maintenance may be challenging if documentation is inadequate                                          | Medium      | Medium | Create thorough technical and user documentation; implement clean, modular code design; use standard technologies that are widely supported                        |

Key risk mitigation principles:

- Early identification and continuous monitoring of risks
- Clear communication with stakeholders about potential issues
- Robust testing throughout development
- Comprehensive documentation for users and future maintainers
- Regular backups and data security reviews

## Key Stakeholders

- **Industry Partner**

  - **Hasti Samadi**

    **Email**: hasti.samadi@unimelb.edu.au

- **Supervisor**

  - **Geela Chee**

    **Email**: geela.chee@unimelb.edu.au
