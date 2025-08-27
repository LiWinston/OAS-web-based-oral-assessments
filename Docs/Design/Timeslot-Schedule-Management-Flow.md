# Time Slot and Schedule Management Flow

This document defines the comprehensive user flows for the time slot and schedule management system in the Oral Assessment System (OAS). The flows cover Course Administrator setup, Examiner self-assignment, and Student booking processes.

## Overview

The time slot and schedule management system follows a structured workflow:

1. **Course Admin Setup**: 3-step wizard for session configuration, time slot creation, and examiner limits
2. **Examiner Self-Assignment**: Examiners select available time slots within defined limits
3. **Student Booking**: Students book available time slots for their assessments
4. **Schedule Management**: Ongoing management and monitoring of the assessment schedule

## User Roles

- **Course Administrator**: Sets up assessment schedules, manages time slots, and monitors the booking process
- **Examiner**: Self-assigns to available time slots and conducts assessments
- **Student**: Books assessment time slots and attends scheduled sessions

---

## Flow 1: Course Administrator - Schedule Creation Workflow

### Pre-conditions
- Course Administrator is logged in with appropriate permissions
- Assignment has been created with basic details
- Student/group data has been imported

### Main Flow: 3-Step Schedule Wizard

#### Step 1: Session Configuration
**Goal**: Define basic parameters that apply to all assessment sessions

**Actions**:
1. Navigate to Assignment → Schedule tab
2. Set **Session Length** (default: 30 minutes)
   - Use +/- buttons or direct input
   - Minimum: 5 minutes, Maximum: 120 minutes
3. Set **Gap Time** between sessions (default: 5 minutes)
   - Buffer time for examiner preparation
   - Minimum: 0 minutes, Maximum: 30 minutes  
4. Set **Examiners Per Session** (default: 2)
   - Number of examiners required for each session
   - Minimum: 1, Maximum: 5

**UI Elements**:
- Progress bar showing Step 1/3
- Number input fields with increment/decrement controls
- Real-time calculation display: "Total time per session: 35 minutes"
- Info tooltips explaining each parameter

**Validation**:
- All fields must have valid positive values
- Session length + gap time cannot exceed 180 minutes
- Continue button disabled until valid

**Next**: Proceed to Step 2

#### Step 2: Time Slot Creation
**Goal**: Create multiple time slot periods for the assessment

**Actions**:
1. **Add Time Slot Form**:
   - Select **Date** (date picker)
   - Set **Start Time** (hour:minute AM/PM dropdowns)
   - Set **Number of Sessions** (numeric input with +/- controls)
   - Enter **Venue** (text input with suggestions)
   - View **Calculated End Time** (read-only, auto-calculated)

2. **Time Slot Management**:
   - Add multiple time slots to build complete schedule
   - **Edit** existing time slots (populate form with existing data)
   - **Duplicate** time slots (copy with ability to modify date/time/venue)
   - **Delete** time slots with confirmation

3. **Time Slot List View**:
   - Display all created time slots in chronological order
   - Show: Date, Time Range, Sessions, Venue
   - Quick action buttons for each slot

**UI Elements**:
- Progress bar showing Step 2/3
- Form with auto-calculation of end times
- List/card view of created time slots
- Empty state with "Add Your First Time Slot" prompt
- Summary cards showing total sessions, time slots count

**Validation Rules**:
- Date cannot be in the past
- Start time must be valid
- Venue is required
- Number of sessions must be positive
- Time slot conflicts detection (same venue, overlapping times)

**Business Logic**:
- End time calculated as: Start Time + (Sessions × Session Length) + ((Sessions-1) × Gap Time)
- Duplicate slots increment date by 1 day by default

**Next**: Must have at least 1 time slot to proceed to Step 3

#### Step 3: Examiner Session Limits
**Goal**: Set maximum session limits for each examiner

**Actions**:
1. **Examiner List Display**:
   - Show all examiners assigned to the course
   - Display current session limits
   - Show total sessions to be assigned

2. **Set Session Limits**:
   - Use numeric input with +/- controls for each examiner
   - Default limit based on fair distribution
   - Real-time validation of total capacity

3. **Complete Setup**:
   - Review summary of configuration
   - Confirm to create the schedule

**UI Elements**:
- Progress bar showing Step 3/3
- Summary card: "X sessions to assign across Y examiners"
- List of examiners with session limit controls
- Validation warnings if total capacity insufficient

**Validation**:
- Total examiner capacity should cover all sessions
- Individual limits must be non-negative
- Warning if examiner limits seem unbalanced

**Completion**:
- API call to create all time slots with session auto-generation
- Redirect to Time Slot Management interface
- Success notification

### Alternative Flows

**A1: Edit Existing Schedule**
- Access via Assignment → Schedule → "Edit Schedule"
- Load existing configuration into 3-step wizard
- Allow modification at any step
- Preserve existing time slots and examiner assignments where possible

**A2: Quick Time Slot Addition**
- From Time Slot Management view
- Direct "Add Time Slot" modal (bypasses 3-step wizard)
- Uses existing session configuration

### Error Conditions
- **E1**: Network failure during setup → Show retry options
- **E2**: Insufficient examiner capacity → Warning with suggested adjustments
- **E3**: Time slot conflicts → Highlight conflicts and suggest alternatives

---

## Flow 2: Time Slot Management Interface

### Pre-conditions
- Schedule has been created via 3-step wizard
- Course Administrator has access to the assignment

### Main Interface Components

#### Calendar View (Left Panel)
**Purpose**: Visual overview of time slots by date

**Features**:
1. **Monthly Calendar Display**:
   - Navigate between months using arrow controls
   - Current month displayed (e.g., "August 2025")
   - Today's date highlighted with blue border

2. **Date Status Indicators**:
   - **Green dot**: All time slots fully staffed (examiners assigned)
   - **Yellow dot**: Some time slots partially staffed
   - **Red dot**: Unstaffed time slots exist
   - **Number badge**: Count of time slots on that date

3. **Date Selection**:
   - Click date to filter time slot list
   - Selected date highlighted
   - Updates right panel content

#### Time Slot List (Right Panel)
**Purpose**: Detailed view and management of time slots

**Features**:
1. **Header**:
   - Shows selected date or "Select a date"
   - Bulk action: "Select All" / "Deselect All" for current date

2. **Time Slot Cards**:
   - **Time**: Start - End time in 24-hour format
   - **Venue**: Location information with map icon
   - **Status**: Pill showing examiner assignment status
     - Green: "2/2 examiners" (fully staffed)
     - Yellow: "1/2 examiners" (partially staffed)  
     - Red: "0/2 examiners" (unstaffed)
   - **Sessions**: "X sessions" count
   - **Booking Status**: "Y/X sessions booked"

3. **Individual Actions** (per time slot):
   - **Edit**: Open AddTimeSlotModal in edit mode
   - **Duplicate**: Create copy with same details
   - **Delete**: Remove with confirmation
   - **Notify**: Send emails to assigned examiners

4. **Bulk Actions** (when time slots selected):
   - Selection indicator: "X time slots selected"
   - **Notify Examiners**: Send emails to all assigned examiners
   - **Duplicate**: Create copies of selected time slots
   - **Delete**: Remove all selected time slots

5. **Examiner Assignment Section**:
   - **Assigned Examiners**: List with avatar, name, and assignment count
   - **Booking Progress**: Collapsible section showing session bookings
   - **Assign Examiners**: Dropdown to add examiners to time slot

### User Actions Flow

#### Adding New Time Slot
1. Click "Add New Time Slot" button
2. AddTimeSlotModal opens with current date pre-selected
3. Fill required fields: Date, Start Time, Sessions, Venue
4. Select examiners from dropdown (optional)
5. View calculated end time
6. Save → Time slot added to list and calendar updated

#### Editing Time Slot
1. Click edit icon on time slot card
2. Modal opens with existing data populated
3. Modify any fields except calculated end time
4. Save → Changes applied, calendar and list updated

#### Managing Examiner Assignments
1. Select time slot(s) from list
2. Choose examiner from "Add examiner" dropdown
3. Examiner added to time slot, status updated
4. Remove via trash icon next to examiner name

#### Bulk Operations
1. Select multiple time slots using checkboxes
2. Bulk action bar appears with selected count
3. Choose action: Notify, Duplicate, or Delete
4. Confirm action → Applied to all selected time slots

### Status and Feedback

#### Visual Status Indicators
- **Calendar**: Color-coded dots for quick status overview
- **Time Slots**: Status pills showing examiner assignment level
- **Progress**: Session booking count (e.g., "0/3 sessions booked")

#### Empty States
- **No date selected**: "Select a date from the calendar to view time slots"
- **No time slots for date**: "No time slots scheduled" with quick add button
- **No examiners assigned**: "No examiners assigned yet"

---

## Flow 3: Schedule Release and Publishing

### Pre-conditions
- Time slots have been created
- Sufficient examiners have been assigned to time slots
- Course Administrator ready to open booking

### Release Process

#### Schedule Validation
**Automatic Checks**:
1. **Examiner Coverage**: All time slots have minimum required examiners
2. **Venue Conflicts**: No overlapping time slots in same venue
3. **Session Distribution**: Reasonable distribution across dates/times

**Validation Results**:
- **Green Status**: Ready for release
- **Warning Status**: Issues that should be resolved but don't prevent release  
- **Error Status**: Critical issues that must be fixed before release

#### Release Schedule Action
1. Navigate to Schedule → Release tab
2. Review validation summary
3. Set **Release Options**:
   - Enable/disable student rescheduling
   - Set booking deadline
   - Configure reminder notifications
4. Click "Release Schedule" button
5. Confirmation dialog with impact summary
6. **Released**: Students can now book time slots

#### Post-Release Monitoring
- **Booking Progress**: Real-time view of student bookings
- **Examiner Notifications**: Automatic emails when students book their slots
- **Adjustment Controls**: Ability to add/modify time slots even after release

### Student Booking Impact
Once released, students will see:
- Available time slots (with adequate examiner coverage)
- Real-time availability updates
- Booking confirmation and reminder emails

---

## Flow 4: Examiner Self-Assignment Process

### Pre-conditions
- Course Administrator has created time slots
- Examiner has been added to the assignment
- Examiner session limits have been configured

### Main Flow

#### View Available Time Slots
1. **Login and Navigate**:
   - Examiner logs in to OAS
   - Navigates to "My Schedule" or "Available Assignments"
   - Selects relevant assignment

2. **Time Slot Overview**:
   - View all time slots needing examiners
   - Information displayed per slot:
     - **Date and Time**: Clear date/time display
     - **Venue**: Location details
     - **Duration**: Calculated from session count and parameters
     - **Examiner Status**: "X of Y examiners assigned"
     - **Session Count**: Number of individual sessions

3. **Filter and Search**:
   - Filter by date range
   - Filter by venue
   - Show only slots needing examiners
   - Sort by date, time, or availability

#### Self-Assignment Actions
1. **Available Slots**:
   - Green "Assign Myself" button for slots with open positions
   - Slot details expand on hover/click

2. **Assignment Limits**:
   - Visual indicator of current assignments vs. limit
   - "X/Y sessions assigned" progress bar
   - Warning when approaching limit

3. **Assignment Confirmation**:
   - Click "Assign Myself" button
   - Immediate confirmation feedback
   - Slot status updates in real-time

4. **Withdraw from Slot**:
   - "Withdraw" button for assigned slots (before cutoff time)
   - Confirmation dialog
   - Slot becomes available for other examiners

#### My Schedule View
1. **Personal Calendar**:
   - Calendar view showing only assigned slots
   - Different color coding for different assignments
   - Print-friendly format

2. **Schedule List**:
   - Chronological list of all assigned sessions
   - Details: Date, Time, Venue, Course/Assignment
   - Status indicators (upcoming, in-progress, completed)

3. **Session Preparation**:
   - Link to assignment rubric and materials
   - Student/group information (once booked)
   - Notes section for personal preparation

### Business Rules

#### Assignment Constraints
- **Maximum Sessions**: Cannot exceed limit set by Course Administrator
- **Time Conflicts**: Cannot assign to overlapping time slots
- **Withdrawal Deadline**: Cannot withdraw within 24 hours of session
- **Minimum Coverage**: Time slots must maintain minimum examiner requirements

#### Notification Triggers
- **Assignment Confirmation**: Email confirmation of new assignment
- **Student Booking**: Notification when student books assigned slot
- **Schedule Changes**: Updates when Course Admin modifies time slots
- **Reminder**: 24-hour advance reminder for upcoming sessions

---

## Flow 5: Student Booking Process

### Pre-conditions
- Course Administrator has released the schedule
- Student is enrolled in the assignment
- Available time slots have adequate examiner coverage

### Main Flow

#### View Available Slots
1. **Access Booking Interface**:
   - Student logs in and navigates to assignment
   - Views "Book Assessment Slot" section
   - Sees only valid, available time slots

2. **Time Slot Information**:
   - **Date and Time**: Clear display with timezone
   - **Venue**: Location with directions/map link
   - **Duration**: Calculated session time
   - **Availability**: "X slots available" or "Fully booked"

#### Booking Process
1. **Individual Assessment**:
   - Select preferred time slot
   - Confirm booking details
   - Submit booking request
   - Receive immediate confirmation

2. **Group Assessment**:
   - Any group member can book for entire group
   - System prevents duplicate bookings by same group
   - Group members notified of booking

3. **Booking Confirmation**:
   - Success message with booking details
   - Automatic email confirmation
   - Calendar integration options

#### Rescheduling (if enabled)
1. **View Current Booking**:
   - See currently booked slot details
   - Check rescheduling eligibility (deadline constraints)

2. **Reschedule Process**:
   - Click "Reschedule" button
   - Select new available time slot
   - Confirm change
   - Updated confirmation sent

### Business Rules

#### Booking Constraints
- **Time Limit**: Cannot book within 24 hours of session time
- **One Booking**: Only one active booking per student/group
- **Availability**: Only fully-staffed time slots visible
- **Group Coordination**: Any member can book for group, prevents duplicates

#### Automatic Actions
- **Email Confirmation**: Immediate booking confirmation
- **Examiner Notification**: Examiners notified of new booking
- **Reminder Emails**: Automated reminders sent to students and examiners
- **Calendar Updates**: Integration with calendar systems

---

## Integration Points

### API Endpoints
The flows integrate with the following API endpoints (detailed in API documentation):

#### Session Configuration
- `GET/PUT /admin/assignments/{id}/session-config`

#### Time Slot Management  
- `GET /admin/assignments/{id}/timeslots` (with filtering)
- `POST /admin/assignments/{id}/timeslots/batch` (batch creation)
- `PUT /admin/assignments/{id}/timeslots/{slotId}` (individual updates)
- `DELETE /admin/assignments/{id}/timeslots` (bulk deletion)

#### Examiner Management
- `GET /admin/assignments/{id}/examiners`
- `PUT /admin/assignments/{id}/examiners/session-limits`
- `PUT /admin/assignments/{id}/timeslots/{slotId}/examiners`

#### Schedule Release
- `GET /admin/assignments/{id}/schedule/status`
- `POST /admin/assignments/{id}/schedule/release`

### Data Flow
1. **Setup Phase**: Course Admin → Session Config → Time Slots → Examiner Limits
2. **Assignment Phase**: Examiners → Self-assign to available slots
3. **Booking Phase**: Students → Book available, staffed slots
4. **Execution Phase**: Conduct assessments according to schedule

### State Management
- **Draft**: Schedule being configured, not visible to students
- **Ready**: Schedule configured but not released
- **Released**: Students can book available slots
- **Active**: Assessment period in progress
- **Completed**: All assessments finished, results being processed

This comprehensive flow ensures a structured, user-friendly process for managing oral assessment schedules from initial setup through completion, with clear role separation and appropriate validation at each step.