import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminResultsService } from '@/services/adminResultsService.js';
import { adminResultsKeys } from '../useAdminResults.js';
import { useNotification } from '@/hooks/useNotification.js';

const safeArray = (value) => (Array.isArray(value) ? value : []);
const normaliseId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};
const normaliseReleaseMode = (value) => {
  const mode = (value || '').toString().toUpperCase();
  return mode === 'SCORES_ONLY' ? 'SCORES_ONLY' : 'FULL';
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
  const detailReleaseMode = detail?.releaseMode ?? detail?.participant?.releaseMode;
  const [releaseMode, setReleaseMode] = useState(() => normaliseReleaseMode(detailReleaseMode));

  const examinerSummary = detail?.examinerSummary ?? {
    total: 0,
    submitted: 0,
    draft: 0,
    reopened: 0,
    counts: {},
    hasSubmitted: false,
    allSubmitted: false,
  };

  useEffect(() => {
    if (releaseDialogOpen) return;
    setReleaseMode((current) => {
      const next = normaliseReleaseMode(detailReleaseMode);
      return current === next ? current : next;
    });
  }, [detailReleaseMode, releaseDialogOpen]);

  const invalidateDetail = useCallback(() => {
    if (!subjectId || !assignmentId || !participantType || !participantId) return;
    queryClient.invalidateQueries(
      adminResultsKeys.participant(subjectId, assignmentId, participantType, participantId)
    );
  }, [queryClient, subjectId, assignmentId, participantType, participantId]);

  const releaseMutation = useMutation({
    mutationFn: async ({ notify, releaseMode: mode }) => {
      const notifyFlag = Boolean(notify);
      const modePayload = normaliseReleaseMode(mode);
      const payload = {
        notify: notifyFlag,
        releaseMode: modePayload,
      };

      if (participantType === 'GROUP') {
        await adminResultsService.releaseGroup(subjectId, assignmentId, participantId, payload);
      } else if (participantType === 'INDIVIDUAL') {
        await adminResultsService.releaseIndividual(subjectId, assignmentId, participantId, payload);
      } else {
        throw new Error('Unsupported participant type for release.');
      }

      return { releaseMode: modePayload };
    },
    onSuccess: (_data, variables) => {
      showNotification('success', 'Results released to students.');
      setReleaseDialogOpen(false);
      if (variables?.releaseMode) {
        setReleaseMode(normaliseReleaseMode(variables.releaseMode));
      }
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
      if (!examiner?.examinerId) {
        throw new Error('Missing submission information for examiner review.');
      }

      const collectedSubmissionIds = safeArray(examiner?.submissionIds)
        .map((id) => normaliseId(id))
        .filter((id) => id != null);
      if (collectedSubmissionIds.length === 0 && examiner?.submissionId != null) {
        const numeric = normaliseId(examiner.submissionId);
        if (numeric != null) {
          collectedSubmissionIds.push(numeric);
        }
      }

      if (collectedSubmissionIds.length === 0) {
        throw new Error('Missing submission information for examiner review.');
      }

      await Promise.all(
        collectedSubmissionIds.map((submissionId) =>
          adminResultsService.reviewExaminerSubmission(
            subjectId,
            assignmentId,
            submissionId,
            examiner.examinerId,
            { reason }
          )
        )
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
    ({ notify, releaseMode: mode }) => {
      const nextMode = normaliseReleaseMode(mode ?? releaseMode);
      setReleaseMode(nextMode);
      releaseMutation.mutate({ notify, releaseMode: nextMode });
    },
    [releaseMutation, releaseMode]
  );

  return {
    examinerSummary,
    releaseMode,
    setReleaseMode,
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
