# Integration Test Bug Log (6-10-2025)

## Issue 1
**Page:** Admin → Courses → {Course} → {Assignment} → Rubric Configuration  
**Steps:**  
1. Assignment type is *Individual*.  
2. Add group-weighted criteria or partial group weights in rubric.  
3. Click “Save Rubric”.  
**Actual Result:**  
Rubric saves successfully even though warning messages appear.  
**Expected Result:**  
Saving should be blocked when an Individual assignment contains any Group weight.  
**Severity:** High  

---

## Issue 2
**Page:** Admin → Courses → {Assignment} → Rubric Configuration (and similar weight input fields)  
**Steps:** Select a weight input field, then scroll the page with mouse wheel.  
**Actual Result:** Both the page and the input value scroll/change simultaneously.  
**Expected Result:** Page scroll should not change numeric input values.  
**Severity:** Medium  

---

## Issue 3
**Page:** Admin → Courses → {Assignment} → Batch Create Time Slot  
**Steps:** Select any numeric input box (e.g., number of sessions or interval) and scroll the page.  
**Actual Result:** Input values change along with page scrolling.  
**Expected Result:** Mouse wheel should scroll the page only, without altering input values.  
**Severity:** Medium  

---

## Issue 4
**Page:** Student → Dashboard  
**Steps:** Login as student and open dashboard.  
**Actual Result:** Data shown is mock/static data not matching the logged-in student.  
**Expected Result:** Dashboard should display real data for the current student (courses, assignments, sessions, grades).  
**Severity:** High  

---

## Issue 5
**Page:** Admin → Timeslot Management; Student → Session Booking  
**Steps:**  
1. Admin creates timeslots (e.g., 09:00–09:25).  
2. Student views available sessions for the same assignment.  
**Actual Result:** Student sees times one hour later (timezone offset).  
**Expected Result:** Both sides should display consistent times in the same timezone.  
**Severity:** High  

---

## Issue 6
**Page:** Examiner → Schedule → “Start Assessment”  
**Steps:**  
1. Click the green “Start Assessment” button from Schedule.  
2. Page redirects to assessment page.  
**Actual Result:** Redirected page is empty (“No Booked Timeslots”).  
**Expected Result:** Redirect should lead to the correct assessment view with assigned students/groups.  
**Severity:** High

---

## Issue 7
**Page:** Examiner → Assessment (grading page header)  
**Steps:** Enter assessment page for a timeslot and check top status label.  
**Actual Result:** Displays “Student 2/2” though only one student exists.  
**Expected Result:** Should show correct count, e.g., “Student 1/1”.  
**Severity:** Medium  

---

## Issue 8
**Page:** Examiner → Assessment → Feedback tab  
**Steps:**  

1. Write content in Overall Feedback or Private Notes.  
2. Click “Save as Draft”.  
**Actual Result:** Feedback content not saved; re-entering page shows blank fields.  
**Expected Result:** Draft save should persist feedback and private notes.  
**Severity:** High  

---

## Issue 9
**Page:** Admin → Results; Student → Results  
**Steps:**  
1. Admin releases results.  
2. Student checks results page and email notifications.  
**Actual Result:**  
- No email notification received.  
- Student results page does not show released grades.  
**Expected Result:**  
- Email notification should be sent on release.  
- Student results page should display released results.  
**Severity:** High  