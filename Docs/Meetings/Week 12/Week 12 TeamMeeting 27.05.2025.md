# Week 12 Team Meeting Minutes

| **Meeting Information** |               |
| ----------------------------- | ------------- |
| **Date:**               | May 27, 2025  |
| **Time:**               | 14:00 - 15:30 |
| **Location:**           | Online (Zoom) |
| **Facilitator:**        | Yunpeng Xiong |
| **Note Taker:**         | Ian Chi       |
| **Attendees:**          | All members   |

## Agenda

1. Sprint 3 Progress Update (20 mins)
2. Technical Discussion: Email Field Implementation (30 mins)
3. Presentation Preparation (30 mins)
4. Action Items and Next Steps (10 mins)

## Discussion Items

### 1. Sprint 3 Progress Update

- Backend development of User Account Management has been completed
- Frontend implementation of Super Admin interfaces is 80% complete
- Course Admin interfaces are around 70% complete
- Data import/export functionality is at 60% completion
- Testing has begun for the completed components

### 2. Technical Discussion: Email Field Implementation

**Issue:** Frontend and backend teams have different approaches to handling the email field in the system.

**Frontend Team's Position:**

- Proposing to use email as a unique identifier throughout the application
- Argues for email-based authentication for all users including students
- Suggests maintaining email as a primary contact method across the system
- Believes email is more user-friendly and familiar to end users

**Backend Team's Position:**

- Recommending use of numeric IDs as primary keys in database
- Concerned about security implications of email-based authentication for all user types
- Suggests keeping email as a property but not a primary identifier
- Worried about potential system issues if users need to change their email

**Discussion Outcomes:**

- Compromise reached: Backend will maintain numeric IDs for database integrity while frontend can display and use emails for user-facing interactions
- Email will be unique in the system but won't be used as a primary key in database design
- Authentication system will support both email-based login and ID-based login depending on user type
- Documentation will be updated to clarify this implementation approach

### 3. Presentation Preparation

**Presentation Structure:**

- Introduction and Project Overview (2 mins) - Ian Chi
- System Architecture and Technology Stack (3 mins) - Yunpeng Xiong
- Frontend Design and User Experience (3 mins) - Yanqing Shi
- Backend Implementation and Security Features (3 mins) - Dongqiao He
- Testing Strategy and Results (2 mins) - Weiran Xu
- Project Challenges and Solutions (2 mins) - Xiang Wang
- Demo (5 mins) - Caspar Ye and Yukun Fu
- Next Steps and Future Work (2 mins) - Benyuan Wang
- Q&A (5 mins) - All team members

**Preparation Tasks:**

- Each presenter will prepare their slides by Friday, June 12
- Rehearsal scheduled for Monday, June 15 at 10:00
- Demo preparation will require additional testing environments setup
- Ian will coordinate slide template and compile final presentation

**Presentation Visual Elements:**

- System architecture diagram needs refinement
- UI screenshots should be updated with latest designs
- Consider adding short video clips for complex interaction flows
- Include key metrics from testing results

## Action Items

| **Task**                                        | **Assignee** | **Due Date** |
| ----------------------------------------------------- | ------------------ | ------------------ |
| Update system documentation regarding email field use | Yunpeng Xiong      | June 12, 2025      |
| Prepare presentation slides for assigned sections     | All team members   | June 12, 2025      |
| Set up demo environment for presentation              | Dongqiao He        | June 14, 2025      |
| Coordinate presentation rehearsal                     | Ian Chi            | June 15, 2025      |
| Complete integration of email field implementation    | Weiran Xu          | June 13, 2025      |

## Next Meeting

- Date: June 17, 2025
- Time: 14:00 - 15:00
- Agenda: Final presentation review and Sprint 3 wrap-up
