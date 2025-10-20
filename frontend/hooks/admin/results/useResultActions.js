import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';
import { adminResultsKeys } from '../useAdminResults.js';
import { useNotification } from '@/hooks/useNotification.js';

const deriveReleaseSubmissionIds = (detail) => {
  if (!detail) return [];

  const explicit = detail?.raw?.submissionId;
  if (explicit) {
    return [explicit];
  }

  const ids = new Set();
  (detail?.examiners || []).forEach((examiner) => {
    if (!examiner) return;
    const status = (examiner.assessmentStatus || '').toUpperCase();
    if (status === 'SUBMITTED' && examiner.submissionId) {
      ids.add(examiner.submissionId);
    }
  });

  return Array.from(ids);
};

export function useResultActions({
  subjectId,
  assignmentId,
  participantType,
  participantId,
  detail,
  refetch,
}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState({ open: false, examiner: null });

  const examinerSummary = detail?.examinerSummary ?? {
    total: 0,
    submitted: 0,
    draft: 0,
    reopened: 0,
    counts: {},
    hasSubmitted: false,
    allSubmitted: false,
  };

  const releaseSubmissionIds = useMemo(() => deriveReleaseSubmissionIds(detail), [detail]);

  const invalidateDetail = useCallback(() => {
    if (!subjectId || !assignmentId || !participantType || !participantId) return;
    queryClient.invalidateQueries(
      adminResultsKeys.participant(subjectId, assignmentId, participantType, participantId)
    );
  }, [queryClient, subjectId, assignmentId, participantType, participantId]);

  const releaseMutation = useMutation({
    mutationFn: async ({ notify }) => {
      const ids = deriveReleaseSubmissionIds(detail);
      if (!ids.length) {
        throw new Error('No submissions available to release.');
      }

      const notifyFlag = Boolean(notify);

      await Promise.all(
        ids.map((submissionId) =>
          adminResultsService.releaseSubmission(subjectId, assignmentId, submissionId, {
            notify: notifyFlag,
          })
        )
      );

      if (participantType === 'GROUP') {
        await adminResultsService.releaseGroup(subjectId, assignmentId, participantId, {
          notify: notifyFlag,
        });
      } else if (participantType === 'INDIVIDUAL') {
        await adminResultsService.releaseIndividual(subjectId, assignmentId, participantId, {
          notify: notifyFlag,
        });
      }

      return { submissionIds: ids };
    },
    onSuccess: () => {
      showNotification('success', 'Results released to students.');
      setReleaseDialogOpen(false);
      invalidateDetail();
      refetch?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to release results.';
      showNotification('error', message);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ reason, examiner }) => {
      if (!examiner?.submissionId || !examiner?.examinerId) {
        throw new Error('Missing submission information for examiner review.');
      }

      return adminResultsService.reviewExaminerSubmission(
        subjectId,
        assignmentId,
        examiner.submissionId,
        examiner.examinerId,
        { reason }
      );
    },
    onSuccess: () => {
      showNotification('success', 'Requested examiner to revise their marking.');
      setReviewDialog({ open: false, examiner: null });
      invalidateDetail();
      refetch?.();
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to request examiner review.';
      showNotification('error', message);
    },
  });

  const openReviewDialog = useCallback((examiner) => {
    setReviewDialog({ open: true, examiner });
  }, []);

  const closeReviewDialog = useCallback(() => {
    setReviewDialog({ open: false, examiner: null });
  }, []);

  const handleReviewConfirm = useCallback(
    ({ reason }) => {
      if (!reviewDialog.examiner) return;
      reviewMutation.mutate({ reason, examiner: reviewDialog.examiner });
    },
    [reviewDialog.examiner, reviewMutation]
  );

  const handleReleaseConfirm = useCallback(
    ({ notify }) => {
      releaseMutation.mutate({ notify });
    },
    [releaseMutation]
  );

  return {
    examinerSummary,
    releaseSubmissionIds,
    releaseDialogOpen,
    setReleaseDialogOpen,
    releaseMutation,
    reviewDialog,
    openReviewDialog,
    closeReviewDialog,
    reviewMutation,
    handleReviewConfirm,
    handleReleaseConfirm,
  };
}

export default useResultActions;
