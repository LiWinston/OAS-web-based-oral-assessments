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
  const [absentStudents, setAbsentStudents] = useState([]); // list of studentIds

  const [assessmentId, setAssessmentId] = useState(null);
  const [isDraft, setIsDraft] = useState(true); // Default to draft to allow editing

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

    console.log('DEBUG useAssessmentDraft - Loading existing assessment:', existing);

    setAssessmentId(existing.assessmentId || null);
    // Allow re-editing of any assessment (including submitted ones)
    setIsDraft(true);

    const groupEntity = existing.entities?.find((e) => e.kind === "GROUP");
    const individualEntities = (existing.entities || []).filter((e) => e.kind === "INDIVIDUAL");

    console.log('DEBUG useAssessmentDraft - Found entities:', { groupEntity, individualEntities });

    if (groupEntity) {
      const ratings = {};
      const comments = {};
      
      console.log('DEBUG useAssessmentDraft - Processing group items:', groupEntity.items);
      
      groupEntity.items?.forEach((item) => {
        console.log('DEBUG useAssessmentDraft - Processing item:', item);
        
        const range = getRatingRange(sessionContext, item.criterionId, item.levelId);
        console.log('DEBUG useAssessmentDraft - Got range for item:', { 
          criterionId: item.criterionId, 
          levelId: item.levelId, 
          range 
        });
        
        ratings[item.criterionId] = {
          levelId: item.levelId,
          points: item.points,
          ...range,
        };
        if (item.comments?.length) {
          comments[item.criterionId] = item.comments.map((c) => c.text).join("\n");
        }
      });
      
      console.log('DEBUG useAssessmentDraft - Final ratings:', ratings);
      console.log('DEBUG useAssessmentDraft - Final comments:', comments);
      
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
        // Interpret ABSENT marker
        if (entity?.overallFeedback === 'ABSENT' || entity?.notes === 'ABSENT') {
          setAbsentStudents((prev) => Array.from(new Set([...(prev || []), entity.studentId])));
        }
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
      } else {
        console.warn('Rating change ignored - no valid target', { assessmentType, selectedStudent });
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

    // absence tracking
    absentStudents,
    setAbsentStudents,

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
  
  console.log('DEBUG getRatingRange - Looking for range:', {
    criterionId,
    levelId,
    foundCriterion: !!criterion,
    criterionDescription: criterion?.description,
    availableLevels: criterion?.levels?.map(l => ({ levelId: l.levelId, description: l.description }))
  });
  
  const level = criterion?.levels?.find((l) => l.levelId === levelId);
  
  console.log('DEBUG getRatingRange - Found level:', {
    levelId,
    foundLevel: level,
    result: level ? { minPoints: level.minPoints, maxPoints: level.maxPoints } : {}
  });
  
  return level
    ? { minPoints: level.minPoints, maxPoints: level.maxPoints }
    : {};
}

