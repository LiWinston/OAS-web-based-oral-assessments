'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useAuth from '../../../../hooks/useAuth';
import { useNotification } from '../../../../hooks/useNotification';
import { useMarkingSessionQuery, useSaveDraftMutation, useSubmitAssessmentMutation } from '../../../../hooks/examiner/assessment/useMarkingSessionQuery';
import { useAssessmentDraft } from '../../../../hooks/examiner/assessment/useAssessmentDraft';
import { useAssessmentValidation } from '../../../../hooks/examiner/assessment/useAssessmentValidation';
import { useAutoSave } from '../../../../hooks/examiner/assessment/useAutoSave';
import { buildAssessmentPayload } from '../../../../utils/assessment';

import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import HeaderStatusBar from '../../../../components/examiner/assessment/HeaderStatusBar';
import SessionInfo from '../../../../components/examiner/assessment/SessionInfo';
import StudentSwitcher from '../../../../components/examiner/assessment/StudentSwitcher';
import RubricTable from '../../../../components/examiner/assessment/RubricTable';
import TotalsPanel from '../../../../components/examiner/assessment/TotalsPanel';
import SubmitDialog from '../../../../components/examiner/assessment/SubmitDialog';

export default function ExaminerAssessmentMarking() {
  const router = useRouter();
  const routeParams = useParams();
  const { user, userId } = useAuth();
  const { showNotification } = useNotification();

  const sessionId = routeParams?.sessionId;
  const examinerId = userId || user?.id;

  const { data, isLoading } = useMarkingSessionQuery(sessionId, examinerId);
  const [sessionContext, setSessionContext] = useState(null);

  // Mirror query data into local state for light editing of predefined comments
  useEffect(() => {
    if (data) setSessionContext(data);
  }, [data]);

  const {
    assessmentType,
    setAssessmentType,
    selectedStudent,
    setSelectedStudent,
    groupRatings,
    individualRatings,
    groupComments,
    individualComments,
    overallFeedback,
    privateNotes,
    setOverallFeedback,
    setPrivateNotes,
    handleRatingChange,
    handleCommentChange,
    assessmentId,
    setAssessmentId,
    isDraft,
    setIsDraft,
    draftFingerprint,
  } = useAssessmentDraft(sessionContext);

  const { validation, isAllStudentsComplete } = useAssessmentValidation(
    sessionContext,
    groupRatings,
    individualRatings
  );

  const saveDraftMutation = useSaveDraftMutation(sessionId);
  const submitMutation = useSubmitAssessmentMutation(sessionId);

  const buildDraftPayload = () =>
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
    });

  const { status: autoSaveStatus } = useAutoSave({
    enabled: Boolean(sessionContext && (isDraft || assessmentId)),
    deps: draftFingerprint,
    buildPayload: buildDraftPayload,
    saveDraft: async (payload) => {
      const res = await saveDraftMutation.mutateAsync(payload);
      setAssessmentId(res.assessmentId);
      setIsDraft(true);
      return res;
    },
    onSaved: () => {
      // no op; status indicator is enough
    },
    delay: 3000,
  });

  const onSaveDraftClick = async () => {
    try {
      const payload = buildDraftPayload();
      const res = await saveDraftMutation.mutateAsync(payload);
      setAssessmentId(res.assessmentId);
      setIsDraft(true);
      showNotification('success', 'Draft saved successfully');
    } catch (e) {
      showNotification('error', 'Failed to save draft');
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const onSubmit = async () => {
    try {
      let id = assessmentId;
      if (!id) {
        // first ensure saved draft exists
        const draftRes = await saveDraftMutation.mutateAsync(buildDraftPayload());
        id = draftRes.assessmentId;
        setAssessmentId(id);
        setIsDraft(true);
      }

      const res = await submitMutation.mutateAsync({ assessmentId: id });
      if (res?.status === 'SUBMITTED') {
        setIsDraft(false);
        showNotification('success', 'Assessment submitted successfully');
        setTimeout(() => router.push('/examiner/schedule'), 1500);
      }
    } catch (e) {
      showNotification('error', 'Failed to submit assessment');
    }
  };

  const handleSavePredefinedComment = async (criterionId, levelId, text) => {
    if (!sessionContext?.assignment?.id) return;
    try {
      const res = await (await import('../../../../services/examinerAssessmentService')).default.addPredefinedComment(
        sessionContext.assignment.id,
        criterionId,
        levelId,
        text
      );
      if (res?.success && res?.data) {
        setSessionContext((prev) => {
          const pc = { ...(prev?.predefinedComments || {}) };
          const byCrit = { ...(pc[criterionId] || {}) };
          const arr = [...(byCrit[levelId] || [])];
          arr.push(res.data);
          byCrit[levelId] = arr;
          pc[criterionId] = byCrit;
          return { ...prev, predefinedComments: pc };
        });
        showNotification('success', 'Saved to library');
      } else {
        showNotification('error', 'Failed to save to library');
      }
    } catch (e) {
      showNotification('error', 'Error saving to library');
    }
  };

  const disabledInputs = !isDraft && Boolean(assessmentId);

  const assignmentType = sessionContext?.assignment?.type;

  const criteria = sessionContext?.assignment?.rubric?.criteria || [];

  const selectedRatings = useMemo(() => {
    return assessmentType === 'GROUP'
      ? groupRatings
      : individualRatings?.[selectedStudent] || {};
  }, [assessmentType, groupRatings, individualRatings, selectedStudent]);

  const commentsForSelected = useMemo(() => {
    return assessmentType === 'GROUP'
      ? groupComments
      : individualComments?.[selectedStudent] || {};
  }, [assessmentType, groupComments, individualComments, selectedStudent]);

  if (isLoading || !sessionContext) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/examiner" className="text-gray-500 dark:text-gray-400 hover:text-blue-600">Dashboard</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <a href="/examiner/schedule" className="text-gray-500 dark:text-gray-400 hover:text-blue-600">Schedule</a>
          </li>
          <li className="flex items-center">
            <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Assessment</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <HeaderStatusBar
        isDraft={isDraft}
        assignmentType={assignmentType}
        validation={validation}
        selectedStudent={selectedStudent}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Session information */}
      <SessionInfo sessionContext={sessionContext} />

      {/* Mixed type toggle */}
      {assignmentType === 'mixed' && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg shadow p-1">
            <Button
              variant={assessmentType === 'GROUP' ? 'default' : 'ghost'}
              className="rounded-md"
              onClick={() => setAssessmentType('GROUP')}
            >
              <i className="fas fa-users mr-2"></i>
              Group Assessment
            </Button>
            <Button
              variant={assessmentType === 'INDIVIDUAL' ? 'default' : 'ghost'}
              className="rounded-md"
              onClick={() => {
                setAssessmentType('INDIVIDUAL');
                if (!selectedStudent) {
                  const first = sessionContext.entity.individuals?.[0]?.studentId;
                  if (first) setSelectedStudent(first);
                }
              }}
            >
              <i className="fas fa-user mr-2"></i>
              Individual Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Student selector */}
      {assessmentType === 'INDIVIDUAL' && sessionContext.entity.individuals && (
        <StudentSwitcher
          individuals={sessionContext.entity.individuals}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          perStudentMissing={validation.perStudentMissing || []}
          isAllStudentsComplete={isAllStudentsComplete}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="rubric" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="rubric"><i className="fas fa-clipboard-list mr-2"></i>Rubric</TabsTrigger>
          <TabsTrigger value="feedback"><i className="fas fa-comment-alt mr-2"></i>Feedback</TabsTrigger>
          <TabsTrigger value="notes"><i className="fas fa-sticky-note mr-2"></i>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="rubric">
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
          />
        </TabsContent>

        <TabsContent value="feedback">
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Feedback</label>
              <textarea
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="10"
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                placeholder="Summarize overall performance and key observations..."
                disabled={disabledInputs}
              />
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  <i className="fas fa-info-circle mr-2"></i>
                  This feedback will be visible to students when results are released.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Private Notes</label>
              <textarea
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="10"
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                placeholder="Record observations, questions, or notes for internal use..."
                disabled={disabledInputs}
              />
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                <p className="text-blue-800 dark:text-blue-200">
                  <i className="fas fa-info-circle mr-2"></i>
                  These notes will be shared with Course Coordinators but not with students.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Totals */}
      <TotalsPanel
        assignment={sessionContext.assignment}
        criteria={criteria}
        groupRatings={groupRatings}
        individualRatings={individualRatings}
        individuals={sessionContext.entity.individuals || []}
      />

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
          <Button variant="outline" onClick={() => router.push('/examiner/schedule')}>Cancel</Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={disabledInputs || validation.totalMissing > 0} title={validation.totalMissing > 0 ? 'Complete all required rubric selections first' : ''}>
            Complete Assessment
          </Button>
        </div>
      </div>

      <SubmitDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        validation={validation}
        assignment={sessionContext.assignment}
        onConfirm={onSubmit}
      />
    </div>
  );
}
