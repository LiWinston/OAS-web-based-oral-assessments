# Integration Test Bug Log (24/9/25)

## Issue 1
**Page:** Examiner → Dashboard  
**Steps:** Login as examiner and navigate to dashboard  
**Actual Result:** Displayed data is fake and not related to the current examiner  
**Expected Result:** Dashboard should display the real data of the logged-in examiner  
**Severity:** High  
**Ownership:** Backend (data source)

---

## Issue 2
**Page:** Examiner → Schedule (Self-Assign)  
**Steps:** Select a course and try to self-assign sessions  
**Actual Result:** Only shows sessions already assigned to the examiner.  
API `/api/examiners/{examinerId}/assignments/{assignmentId}/sessions/query` returns only assigned sessions.  
**Expected Result:** Should display all available sessions, including those not yet assigned, with clear distinction.  
**Severity:** High  
**Ownership:** Backend (API incomplete), Frontend (UI handling)

---

## Issue 3
**Page:** Examiner → Schedule (Self-Assign Flow)  
**Steps:** Navigate to self-assign page  
**Actual Result:** Flow jumps directly to final step; back button text is "Back to assessment selection"  
**Expected Result:** Multi-step flow (course → session selection → confirmation) should be followed. Back button should correctly return to previous step.  
**Severity:** Medium  
**Ownership:** Frontend (UI flow & wording)

---

## Issue 4
**Page:** Student → Dashboard  
**Steps:** Login as student and navigate to dashboard  
**Actual Result:** Displayed data is fake and not related to the current student  
**Expected Result:** Dashboard should display the real data of the logged-in student  
**Severity:** High  
**Ownership:** Backend (data source)

---

## Issue 5
**Page:** Student → Assignment → Date → Session Selection  
**Steps:** Choose assignment, select date, then session page  
**Actual Result:** Venue filter exists but only "All" is available  
**Expected Result:** Venue filter should list all available venues for the assignment  
**Severity:** Medium  
**Ownership:** Frontend (UI not populated), Backend (check venue list)

---

## Issue 6
**Page:** Student → Session Booking  
**Steps:** Book a session, then try to book again  
**Actual Result:** Student can book again despite already having a booking  
**Expected Result:** Should block repeated bookings if an active booking exists  
**Severity:** High  
**Ownership:** Backend (missing validation), Frontend (UI not restricted)

---

## Issue 7
**Page:** Student → Session Booking  
**Steps:** Book a session, then book another one  
**Actual Result:**  
- Frontend shows the latest booking  
- Backend stores **two booking records** (old not deleted + new added)  
- Old session remains locked, preventing others from booking  
**Expected Result:** Only one booking record per student; new booking should overwrite old one and release the previous session  
**Severity:** High  
**Ownership:** Backend (data consistency & locking issue)

---

## Issue 8
**Page:** Student → Session Booking → Cancel & Rebook  
**Steps:** Book a session → cancel → book another session → try cancel again  
**Actual Result:** Cannot cancel the new booking  
**Expected Result:** Student should always be able to cancel any current booking  
**Severity:** High  
**Ownership:** Backend (cancellation logic), Frontend (UI refresh)

---

## Issue 9
**Page:** Examiner → Assessment → Assignment Sessions  
**Steps:** Examiner selects an assignment  
**Actual Result:** Examiner can see all sessions, not just their own assigned sessions  
**Expected Result:** Examiner should only see sessions assigned to them  
**Severity:** High  
**Ownership:** Backend (permission filtering)

---

## Issue 10
**Page:** Examiner → Assessment → Grading Records  
**Steps:** Admin reopens an examiner’s submitted grading → examiner views grading  
**Actual Result:** Examiner cannot see their previous grading (data lost)  
**Expected Result:** Previous grading should be visible after reopen and editable for resubmission  
**Severity:** High  
**Ownership:** Backend (data retrieval after reopen), Frontend (display handling)