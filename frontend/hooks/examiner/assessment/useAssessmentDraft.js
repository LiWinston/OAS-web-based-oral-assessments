"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

export function useAssessmentDraft(sessionContext) {
  const [assessmentType, setAssessmentType] = useState("GROUP");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [groupRatings, setGroupRatings] = useState({});
  const [individualRatings, setIndividualRatings] = useState({});
  const [groupComments, setGroupComments] = useState({});
  const [individualComments, setIndividualComments] = useState({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const [assessmentId, setAssessmentId] = useState(null);
  const [isDraft, setIsDraft] = useState(false);

  // Initialize basic selection defaults when context loads
  useEffect(() => {
    if (!sessionContext?.assignment) return;
    const a = sessionContext.assignment;
    if (a.type === "group") setAssessmentType("GROUP");
    else if (a.type === "individual") setAssessmentType("INDIVIDUAL");
    else setAssessmentType("GROUP"); // mixed → default GROUP

    if (a.type === "individual" || a.type === "mixed") {
      const first = sessionContext.entity?.individuals?.[0]?.studentId;
      if (first) setSelectedStudent((s) => s ?? first);
    }
  }, [sessionContext]);

  // Load existing assessment (if present)
  useEffect(() => {
    const existing = sessionContext?.existingAssessment;
    if (!existing) return;

    setAssessmentId(existing.assessmentId || null);
    setIsDraft(existing.status === "DRAFT" || existing.status === "REOPENED");

    const groupEntity = existing.entities?.find((e) => e.kind === "GROUP");
    const individualEntities = (existing.entities || []).filter((e) => e.kind === "INDIVIDUAL");

    if (groupEntity) {
      const ratings = {};
      const comments = {};
      groupEntity.items?.forEach((item) => {
        const range = getRatingRange(sessionContext, item.criterionId, item.levelId);
        ratings[item.criterionId] = {
          levelId: item.levelId,
          points: item.points,
          ...range,
        };
        if (item.comments?.length) {
          comments[item.criterionId] = item.comments.map((c) => c.text).join("\n");
        }
      });
      setGroupRatings(ratings);
      setGroupComments(comments);
      setOverallFeedback(groupEntity.overallFeedback || "");
      setPrivateNotes(groupEntity.notes || "");
    }

    if (individualEntities.length) {
      const indRatings = {};
      const indComments = {};
      individualEntities.forEach((entity) => {
        indRatings[entity.studentId] = {};
        indComments[entity.studentId] = {};
        entity.items?.forEach((item) => {
          const range = getRatingRange(sessionContext, item.criterionId, item.levelId);
          indRatings[entity.studentId][item.criterionId] = {
            levelId: item.levelId,
            points: item.points,
            ...range,
          };
          if (item.comments?.length) {
            indComments[entity.studentId][item.criterionId] = item.comments
              .map((c) => c.text)
              .join("\n");
          }
        });
      });
      setIndividualRatings(indRatings);
      setIndividualComments(indComments);
    }
  }, [sessionContext]);

  const handleRatingChange = useCallback(
    (criterionId, rating) => {
      if (assessmentType === "GROUP") {
        setGroupRatings((prev) => ({ ...prev, [criterionId]: rating }));
      } else if (selectedStudent != null) {
        setIndividualRatings((prev) => ({
          ...prev,
          [selectedStudent]: { ...(prev[selectedStudent] || {}), [criterionId]: rating },
        }));
      }
    },
    [assessmentType, selectedStudent]
  );

  const handleCommentChange = useCallback(
    (criterionId, comment) => {
      if (assessmentType === "GROUP") {
        setGroupComments((prev) => ({ ...prev, [criterionId]: comment }));
      } else if (selectedStudent != null) {
        setIndividualComments((prev) => ({
          ...prev,
          [selectedStudent]: { ...(prev[selectedStudent] || {}), [criterionId]: comment },
        }));
      }
    },
    [assessmentType, selectedStudent]
  );

  // dirty tracking
  const draftFingerprint = useMemo(
    () => ({
      groupRatings,
      individualRatings,
      groupComments,
      individualComments,
      overallFeedback,
      privateNotes,
    }),
    [
      groupRatings,
      individualRatings,
      groupComments,
      individualComments,
      overallFeedback,
      privateNotes,
    ]
  );

  return {
    // selection
    assessmentType,
    setAssessmentType,
    selectedStudent,
    setSelectedStudent,

    // data
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

    // persistence flags
    assessmentId,
    setAssessmentId,
    isDraft,
    setIsDraft,

    // autosave deps
    draftFingerprint,
  };
}

function getRatingRange(sessionContext, criterionId, levelId) {
  const criterion = sessionContext?.assignment?.rubric?.criteria?.find(
    (c) => c.criterionId === criterionId
  );
  const level = criterion?.levels?.find((l) => l.levelId === levelId);
  return level
    ? { minPoints: level.minPoints, maxPoints: level.maxPoints }
    : {};
}

