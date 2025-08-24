# Sprint 6 Planning - Examiner Assignment and Schedule Management

## Sprint Overview
**Sprint Duration:** Week 6  
**Sprint Goal:** Implement examiner assignment workflow and schedule management to enable the first components of the target user flow MVP  
**Phase:** Phase 2 - Core User Flow MVP Implementation

## Sprint Objectives

### Primary Goals
1. **Enable Examiner Participation in Scheduling Process**
   - Implement examiner authentication and dashboard
   - Develop examiner self-assignment capabilities
   - Create intuitive schedule viewing interfaces

2. **Complete Backend Schedule Management Infrastructure**
   - Finalize Epic 5 backend implementation
   - Support time slot configuration and management
   - Implement capacity management and conflict prevention

3. **Establish Foundation for Student Booking (Next Sprint)**
   - Complete prerequisite components for student workflow
   - Ensure robust scheduling infrastructure

## User Stories and Tasks Breakdown

### Backend Development Team

#### **High Priority - Epic 5 Backend Implementation**
- **Backend 5.1 5.8 5.9** (In Progress)
  - **Assignees:** Crystallen1, LiWinston, wangxiang13
  - **Stories Covered:**
    - 5.1: Define available time slots and venues
    - 5.8: Administrator booking availability management
    - 5.9: Examiner self-assignment to time slots
  - **Focus:** Core scheduling infrastructure and examiner assignment logic

- **Backend 5.2-5.7** (In Progress)
  - **Assignee:** DongqiaoHe
  - **Stories Covered:**
    - 5.2: Group member visibility
    - 5.3: Student view available time slots
    - 5.4: Individual student booking
    - 5.5: Group booking functionality
    - 5.6: Booking rescheduling
    - 5.7: View current bookings
  - **Focus:** Student-facing booking infrastructure (preparation for Sprint 7)

#### **Medium Priority - Epic 4 Backend Completion**
- **Backend 4.4-4.6** (In Progress)
  - **Assignees:** DongqiaoHe, LiWinston, TianyunLei, wangxiang13, YulkonFU
  - **Stories Covered:**
    - 4.4: Rubric hierarchy structure
    - 4.5: Customizable performance levels
    - 4.6: Criterion-specific comment libraries
  - **Focus:** Complete assessment configuration backend

#### **Supporting Tasks**
- **CSV Upload Integration** (In Progress)
  - **Assignees:** DongqiaoHe, TianyunLei
  - **Focus:** Assignment-level CSV upload functionality

### Frontend Development Team

#### **High Priority - Examiner Dashboard and Assignment**
- **5.9: Examiner Self-Assignment Interface**
  - **Assignee:** lihaocheng1006
  - **Deliverables:**
    - Examiner dashboard showing available time slots
    - Self-assignment interface with capacity tracking
    - Schedule conflict prevention UI
    - Clear display of time slot details and requirements

- **5.1: Time Slot Configuration Interface**
  - **Assignee:** yungenchi
  - **Deliverables:**
    - Administrator time slot creation interface
    - Venue and capacity management
    - Time slot validation and conflict detection

#### **Medium Priority - Schedule Management**
- **5.8: Booking Availability Management**
  - **Assignee:** yungenchi
  - **Deliverables:**
    - Administrator controls for booking periods
    - Schedule activation/deactivation interface

- **5.10: Examiner Allocation Limits**
  - **Assignee:** yungenchi
  - **Deliverables:**
    - Administrator interface for setting examiner limits
    - Limit enforcement in assignment interface

#### **Preparation for Next Sprint**
- **Student Booking Interface Components (5.2-5.7)**
  - **Assignee:** lihaocheng1006
  - **Deliverables:**
    - Group member display (5.2)
    - Available slots viewing (5.3)
    - Booking interfaces foundation (5.4-5.7)

### Testing and Quality Assurance

#### **API Testing**
- **Epic 4: API Testing**
  - **Assignee:** weiranxu-unimelb
  - **Focus:** Validate all Epic 4 and Epic 5 backend endpoints

#### **Integration Testing Focus**
- Examiner assignment workflow validation
- Time slot capacity management testing  
- Schedule conflict prevention verification
- Integration between administrative setup and examiner assignment

### Additional Tasks

- **1.4: CSV Export Functionality**
  - **Assignee:** TianyunLei
  - **Priority:** Medium
  - **Focus:** Canvas-compatible results export

- **4.6: Comment Libraries Frontend**
  - **Assignee:** lihaocheng1006  
  - **Priority:** Medium
  - **Focus:** Complete rubric configuration interface

- **2.4: User Account Management**
  - **Assignee:** lihaocheng1006
  - **Priority:** Low
  - **Focus:** Administrative user management interface

## Team Assignments

### Backend Team
- **Primary:** Epic 5 scheduling infrastructure completion
- **Secondary:** Epic 4 configuration backend finalization
- **Leads:** Crystallen1 (5.1/5.8/5.9), DongqiaoHe (5.2-5.7)

### Frontend Team  
- **Primary:** Examiner dashboard and assignment interfaces
- **Secondary:** Administrative scheduling management
- **Leads:** lihaocheng1006 (examiner features), yungenchi (admin scheduling)

### Testing Team
- **Primary:** API validation and integration testing
- **Lead:** weiranxu-unimelb

## Definition of Done

### Backend Tasks
- [ ] All Epic 5 APIs implemented and tested
- [ ] Database schema supports examiner assignment workflow
- [ ] Capacity management and conflict prevention logic working
- [ ] API documentation updated
- [ ] Unit tests written and passing

### Frontend Tasks
- [ ] Examiner dashboard fully functional
- [ ] Self-assignment workflow complete and intuitive
- [ ] Administrative scheduling interfaces operational
- [ ] Integration with backend APIs successful
- [ ] Responsive design implemented
- [ ] User acceptance criteria validated

### Integration Requirements
- [ ] End-to-end examiner assignment workflow functional
- [ ] No conflicts in concurrent examiner assignments
- [ ] Proper error handling and user feedback
- [ ] Performance acceptable for expected load

## Success Criteria

### Demonstrable Workflow
By sprint end, the system must support:
1. **Administrator creates time slots** → slots available in system
2. **Examiner logs in** → sees available slots requiring assignment  
3. **Examiner self-assigns** → slot capacity updated, examiner schedule updated
4. **Administrator monitors** → can see assignment status and slot validity

### Performance Targets
- Examiner assignment response time < 2 seconds
- Schedule loading time < 3 seconds
- Support for 100+ concurrent examiner assignments
- Zero data consistency issues in concurrent operations

### Quality Standards
- All user interfaces meet accessibility standards
- Mobile-responsive design for tablet use during exams
- Comprehensive error handling with user-friendly messages
- Audit trail for all assignment changes

## Risk Mitigation

### Technical Risks
- **Backend complexity in Epic 5:** Prioritize core scheduling over advanced features
- **Concurrency issues in assignments:** Implement proper locking mechanisms
- **Integration challenges:** Daily integration testing between teams

### Timeline Risks  
- **Frontend dependency on backend:** Backend team provides API documentation early
- **Testing bottlenecks:** Parallel development of test scenarios with implementation
