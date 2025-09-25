'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import useAuth from '../../../../../../hooks/useAuth';
import { useNotification } from '../../../../../../hooks/useNotification';

// Components
import SessionInfo from '../../../../../../components/examiner/assessment/SessionInfo';
import HeaderStatusBar from '../../../../../../components/examiner/assessment/HeaderStatusBar';
import RubricTable from '../../../../../../components/examiner/assessment/RubricTable';
import SubmitDialog from '../../../../../../components/examiner/assessment/SubmitDialog';
import StudentSwitcher from '../../../../../../components/examiner/assessment/StudentSwitcher';

// Hooks  
import { useMarkingSessionQuery, useSaveDraftMutation, useSubmitAssessmentMutation } from '../../../../../../hooks/examiner/assessment/useMarkingSessionQuery';
import { useAssessmentDraft } from '../../../../../../hooks/examiner/assessment/useAssessmentDraft';
import { useAutoSave } from '../../../../../../hooks/examiner/assessment/useAutoSave';

// Utils
import { buildAssessmentPayload } from '../../../../../../utils/assessment';

export default function ExaminerAssessmentMarking() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  // Get route parameters
  const assignmentId = routeParams.assignmentId;
  const sessionId = routeParams.sessionId;
  const submissionId = routeParams.submissionId;
  const examinerId = userId || user?.id;
  
  // Get URL query parameters for new assessments
  const subjectType = searchParams.get('subjectType') || 'GROUP';
  const subjectId = searchParams.get('subjectId');

  // Fetch session context
  const {
    data: sessionContext,
    isLoading: loadingContext,
    error: contextError,
  } = useMarkingSessionQuery(submissionId, examinerId, sessionId, assignmentId, subjectType, subjectId);

  // Assessment draft state
  const {
    groupRatings,
    individualRatings,
    groupComments,
    individualComments,
    overallFeedback,
    setOverallFeedback,
    privateNotes,
    setPrivateNotes,
    handleRatingChange,
    handleCommentChange,
    selectedStudent,
    setSelectedStudent,
    assessmentType,
    assessmentId,
    setAssessmentId,
    isDraft,
    setIsDraft,
  } = useAssessmentDraft(sessionContext);

  // Mutations
  const saveDraftMutation = useSaveDraftMutation(submissionId);
  const submitMutation = useSubmitAssessmentMutation(submissionId);

  // Build payload for operations - memoized to prevent repeated calls
  const buildDraftPayload = useCallback(() =>
    buildAssessmentPayload({
      sessionContext,
      examinerId,
      status: 'DRAFT',
      groupRatings,
      individualRatings,
      groupComments,
      individualComments,
      overallFeedback,
      privateNotes,
    }), [sessionContext, examinerId, groupRatings, individualRatings, groupComments, individualComments, overallFeedback, privateNotes]);

  // Auto-save
  useAutoSave({
    enabled: false, // Disabled for now due to 500 error
    data: buildDraftPayload(),
    onSave: async (data) => {
      // no op; status indicator is enough
    },
    delay: 5000,
  });

  const onSaveDraftClick = async () => {
    try {
      const payload = buildDraftPayload();
      // Include sessionContext and sessionId for backend API conversion
      const draftData = { 
        ...payload, 
        sessionContext,
        sessionId: sessionId // Pass route sessionId to override API response sessionId
      };
      
      const res = await saveDraftMutation.mutateAsync(draftData);
      if (res?.submissionId) {  // Backend returns submissionId, not assessmentId
        setAssessmentId(res.submissionId);
        setIsDraft(true);
        showNotification('success', 'Draft saved successfully');
        // Navigate back to assessment list after successful save
        setTimeout(() => {
          router.push(`/examiner/assessment/${assignmentId}/${sessionId}`);
        }, 1500);
      } else {
        showNotification('error', 'Failed to save draft - invalid response');
      }
    } catch (e) {
      console.error('Save draft error:', e);
      showNotification('error', 'Failed to save draft');
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const onSubmit = async () => {
    try {
      let id = assessmentId;
      if (!id) {
        // first ensure saved draft exists
        const draftPayload = buildDraftPayload();
        const draftData = { 
          ...draftPayload, 
          sessionContext,
          sessionId: sessionId // Pass route sessionId to override API response sessionId
        };
        const draftRes = await saveDraftMutation.mutateAsync(draftData);
        id = draftRes?.submissionId;
        if (id) {
          setAssessmentId(id);
          setIsDraft(true);
        }
      }

      const payload = buildAssessmentPayload({
        sessionContext,
        examinerId,
        status: 'SUBMITTED',
        groupRatings,
        individualRatings,
        groupComments,
        individualComments,
        overallFeedback,
        privateNotes,
      });
      
      // Include sessionContext for backend API conversion
      const submissionData = { 
        ...payload, 
        assessmentId: id,
        sessionContext 
      };
      
      const res = await submitMutation.mutateAsync(submissionData);
      if (res?.status === 'SUBMITTED') {  // Backend returns status directly, not data.status
        setIsDraft(false);
        showNotification('success', 'Assessment submitted successfully');
        setTimeout(() => router.push(`/examiner/assessment/${assignmentId}/${sessionId}`), 1500);
      } else {
        showNotification('error', 'Failed to submit assessment - invalid response');
      }
    } catch (e) {
      console.error('Submit error:', e);
      showNotification('error', 'Failed to submit assessment');
    }
  };

  const handleSavePredefinedComment = async (criterionDescription, levelDescription, text) => {
    if (!sessionContext?.assignment?.id) return;
    try {
      const { assignmentService } = await import('../../../../../../services/assignmentService');
      const res = await assignmentService.savePredefinedComment(
        sessionContext.assignment.id,
        criterionDescription,
        levelDescription,
        text
      );
      if (res?.success) {
        showNotification('success', 'Predefined comment saved');
        // Optionally refresh the session context to get updated predefined comments
        // queryClient.invalidateQueries({ queryKey: ["markingSessionContext"] });
      } else {
        showNotification('error', res?.message || 'Failed to save predefined comment');
      }
    } catch (e) {
      console.error('Error saving predefined comment:', e);
      showNotification('error', 'Failed to save predefined comment');
    }
  };

  // UI State
  const [currentTab, setCurrentTab] = useState('rubric');

  // Validation
  const criteria = sessionContext?.assignment?.rubric?.criteria || [];
  const missingRubricRatings = criteria.filter((criterion) => {
    if (assessmentType === 'GROUP') {
      return !groupRatings[criterion.criterionId];
    } else {
      return !individualRatings?.[selectedStudent]?.[criterion.criterionId];
    }
  });

  const validation = {
    totalMissing: missingRubricRatings.length,
    missingCriteria: missingRubricRatings.map((c) => c.description),
  };

  // Get ratings and comments for the selected target
  const selectedRatings = assessmentType === 'GROUP' 
    ? groupRatings 
    : (individualRatings?.[selectedStudent] || {});
  const commentsForSelected = assessmentType === 'GROUP' 
    ? groupComments 
    : (individualComments?.[selectedStudent] || {});

  // Allow editing for draft assessments and new assessments
  // Disable only if explicitly marked as non-editable by backend
  const disabledInputs = false; // Always allow editing for now

  // Loading and error states - ensure consistent structure to prevent hydration mismatch
  if (loadingContext || contextError || !sessionContext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        {loadingContext ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-600">Failed to Load Assessment</h1>
            <p className="text-gray-600">
              {contextError?.message || 'Unable to load assessment context'}
            </p>
            <Button onClick={() => router.push(`/examiner/assessment/${assignmentId}/${sessionId}`)}>
              Back to Assessments
            </Button>
          </>
        )}
      </div>
    );
  }

  if (!sessionContext?.entity?.individuals && sessionContext?.entity?.kind !== 'GROUP') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-red-600">No Students Found</h1>
        <p className="text-gray-600">This assessment timeslot has no students assigned.</p>
        <Button onClick={() => router.push(`/examiner/assessment/${assignmentId}/${sessionId}`)}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <HeaderStatusBar
        autoSaveEnabled={false}
        autoSaveStatus="disabled"
        lastSaved={null}
        onNavigateBack={() => router.push(`/examiner/assessment/${assignmentId}/${sessionId}`)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Session Info */}
          <SessionInfo
            assignment={sessionContext?.assignment}
            entity={sessionContext?.entity}
            existingAssessment={sessionContext?.existingAssessment}
          />


          {/* Main Content */}
          <div className="flex justify-center">
            {/* Assessment Panel */}
            <div className="w-full max-w-6xl">
              <Card className="h-full">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full flex flex-col">
                  <div className="border-b px-6 py-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="rubric">Rubric</TabsTrigger>
                      <TabsTrigger value="feedback">Feedback</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 p-6 overflow-auto">
                    <TabsContent value="rubric" className="mt-0">
                      <RubricTable
                        criteria={criteria}
                        selectedRatings={selectedRatings}
                        onRatingChange={handleRatingChange}
                        comments={commentsForSelected}
                        onCommentChange={handleCommentChange}
                        predefinedComments={sessionContext?.predefinedComments || {}}
                        onSavePredefinedComment={handleSavePredefinedComment}
                        disabled={disabledInputs}
                        assessmentType={assessmentType}
                        assignmentId={assignmentId}
                      />
                    </TabsContent>

                    <TabsContent value="feedback" className="mt-0">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Overall Feedback
                          </label>
                          <textarea
                            value={overallFeedback}
                            onChange={(e) => setOverallFeedback(e.target.value)}
                            disabled={disabledInputs}
                            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                     placeholder-gray-500 dark:placeholder-gray-400
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                     disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                            placeholder="Provide overall feedback for this assessment..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Private Notes (Examiner Only)
                          </label>
                          <textarea
                            value={privateNotes}
                            onChange={(e) => setPrivateNotes(e.target.value)}
                            disabled={disabledInputs}
                            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                     placeholder-gray-500 dark:placeholder-gray-400
                                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                     disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                            placeholder="Add private notes that won't be visible to students..."
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="mb-4 sm:mb-0">
              <Button variant="outline" className="mr-3" onClick={onSaveDraftClick} disabled={disabledInputs}>
                <i className="fas fa-save mr-2"></i>
                Save as Draft
              </Button>
              <Button variant="outline">
                <i className="fas fa-print mr-2"></i>
                Print Preview
              </Button>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => router.push(`/examiner/assessment/${assignmentId}/${sessionId}`)}>Cancel</Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={disabledInputs || validation.totalMissing > 0} title={validation.totalMissing > 0 ? 'Complete all required rubric selections first' : ''}>
                Complete Assessment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <SubmitDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={onSubmit}
        validation={validation}
        assignment={sessionContext?.assignment}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
