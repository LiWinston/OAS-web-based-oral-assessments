# Test Report: Assessment Module

## 1.0 Introduction

**Date:** 2025-09-21

**Project:** Assessment Interface Module

**Objective:** This document details a specific bug identified in the assessment starting process, where the user interface incorrectly prevents an action based on flawed logic.

## 2.0 Test Summary

This report outlines a critical issue where the "Start Assessment" button is improperly disabled for assessments with a "No Mark" status. This defect prevents users from beginning the assessment process as intended. The root cause has been identified in the front-end code, specifically in the conditional logic that controls the button's state. Rectifying this is essential for the core functionality of the assessment module.

## 3.0 Detailed Findings

### 3.1 Defect ID: ASM-001 - "Start Assessment" Button Incorrectly Disabled for "No Mark" Status

- **Status:** New
- **Severity:** High
- **Priority:** High
- **Component:** Assessment Interface

**Defect Description**:

The "Start Assessment" button is erroneously disabled for any assessment that is in a "No Mark" state. This prevents users from initiating an assessment for submissions that have not yet been marked.

**Root Cause Analysis**:

The issue stems from the front-end code logic. The button's disabled attribute is bound to the presence of assessment.submissionId. By design, an assessment in a "No Mark" status will not have a submissionId, causing the button to be permanently disabled for these cases. The logic should instead permit the action for this specific status.

*Code Snippet:*

```javascript
<Button 
  onClick={() => handleStartAssessment(assessment)}
  variant="default"
  disabled={!assessment.submissionId}  
>
```

The condition `disabled={!assessment.submissionId}` incorrectly disables the button when `submissionId` is null or undefined, which is the case for "No Mark" statuses.

**Steps to Reproduce:**

1. Navigate to the assessments list.
2. Locate an assessment that has the status "No Mark".
3. Observe the "Start Assessment" button associated with this assessment.

**Expected Result**:

The "Start Assessment" button should be enabled and clickable for assessments that are in a "No Mark" status.

**Actual Result**:

The "Start Assessment" button is disabled (greyed out and unclickable), preventing the user from starting the assessment process.

**Recommendations**:

Modify the conditional logic for the disabled property of the "Start Assessment" button. The logic should be adjusted to ensure the button is enabled when the assessment status is "No Mark", regardless of the presence of a submissionId. For example, the condition could be changed to something like disabled={assessment.status !== 'No Mark' && !assessment.submissionId} or a more appropriate condition that fits the intended workflow.