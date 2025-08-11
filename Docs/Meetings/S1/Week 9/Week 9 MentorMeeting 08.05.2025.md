# Weekly Mentor Meeting Minutes

## Date: 08/05/2025

## Attendees:

All Team Members and Mentor Geela

## Agenda Items:

1. Individual Contribution Presentations

   - Wangxiang presented his individual contributions to the project
   - Weiran Xu presented his individual contributions to the project
   - Yongchun Li presented his individual contributions to the project

2. Discussion of Client Meeting Pivots

   - Team reviewed the major requirement changes identified during the Week 8 client meeting with Hasti Samadi
   - Discussed implementation strategy for two-tier admin structure (Super Admin and Course Admin)
   - Reviewed the requirement to move CSV upload functionality from course creation level to assignment configuration level
   - Examined implementation approach for mixed-type assignments (containing both individual and group components within the same assignment)

3. Predefined Comments Feature Implementation

   - Team presented their interpretation of client requirements for criterion-specific comment libraries
   - Reviewed sample grading interfaces shown by Mentor Geela to understand current LMS implementation
   - Analyzed the interface elements in the shared grading screens:
     - Comment text entry field with ability to save comments for reuse
     - Dropdown to select from previously saved comments
     - Checkbox functionality to add new comments to the library
   - Discussed potential concurrency issues if multiple examiners could modify existing comments
   - Confirmed approach aligns with existing LMS implementation: examiners can add new comments but not edit existing ones
   - Identified potential user experience challenge with similar comments being saved (e.g., "Excellent" vs. "excellent")

4. Proposed Design Elements for Rubric Configuration and Marking

   - **Admin Rubric Builder Page:**

     - Criterion-specific comment section within the rubric builder interface
     - Comment management panel for each criterion with ability to add, edit, and delete predefined comments
     - Ability to categorize comments by performance levels (e.g., comments for "Excellent" vs. "Satisfactory")
     - Import/export functionality for reusing comment libraries across assignments
     - Preview mode to test how comments will appear to examiners

   - **Examiner Marking Page:**

     - Dropdown selector to choose from predefined comments specific to the criterion being marked
     - Comment text field with formatting options
     - "Save this comment for reuse" checkbox that adds the comment to the shared library
     - Clear indication that saved comments become visible to other examiners
     - Visual distinction between admin-defined and examiner-added comments

   - **User Flow for Comments:**
     - Admin creates criteria and initial comment libraries during rubric configuration
     - Examiner selects a criterion to mark → Views dropdown of available predefined comments
     - Examiner either: 1) Selects existing comment, 2) Writes new comment and opts not to save, or 3) Writes new comment and saves to library
     - If saved, comment becomes available to all examiners for that assignment when marking the same criterion
     - Course Admin can review and manage all comments through the rubric management interface

5. Potential Solutions to Comment Management Issues

   - Implement basic text normalization to prevent nearly-identical comments (e.g., case-insensitive matching)
   - Add a "comment popularity" indicator showing how frequently each comment is used
   - Enable search functionality within comment libraries when they grow large

6. Booking System Implementation
   - Continued discussion on the significant pivot for the time slot scheduling system
   - Reviewed the admin-driven approach for defining detailed time slots with examiner self-assignment
   - Discussed implementation challenges for concurrent sessions and venue assignments

## Action Items:

Similar as Week 8 Client meeting minutes.

## Key Decisions:

1. Adopt the LMS-style approach for comment management as shown in Geela's examples
2. Implement text normalization to reduce duplicate/similar comments
3. Allow examiners to add but not modify/delete comments in the shared library
4. Provide clear visual indication of comment source (admin-defined vs. examiner-added)
5. Include comment management in the Course Admin Predefine comment page dashboard for ongoing curation

## Next Meeting:

15/05/2025 9am-12am
