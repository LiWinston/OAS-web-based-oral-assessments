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
  const [adminNote, setAdminNote] = useState("");
  const [absentStudents, setAbsentStudents] = useState([]); // list of studentIds

  const [assessmentId, setAssessmentId] = useState(null);
  const [isDraft, setIsDraft] = useState(true); // Default to draft to allow editing

  // Initialize basic selection defaults when context loads
  useEffect(() => {
    if (!sessionContext?.assignment?.rubric?.criteria) return;
    const criteria = sessionContext.assignment.rubric.criteria;
    const appliesToGroup = (c) => {
      const target = (c.appliesTo || "BOTH").toUpperCase();
      return target === "GROUP" || target === "BOTH";
    };
    const appliesToIndividual = (c) => {
      const target = (c.appliesTo || "BOTH").toUpperCase();
      return target === "INDIVIDUAL" || target === "BOTH";
    };

    const hasGroup = criteria.some(appliesToGroup);
    const hasIndividual = criteria.some(appliesToIndividual);

    if (hasGroup && !hasIndividual) {
      setAssessmentType("GROUP");
    } else if (!hasGroup && hasIndividual) {
      setAssessmentType("INDIVIDUAL");
    } else if (hasGroup && hasIndividual) {
      setAssessmentType((prev) => (prev === "GROUP" || prev === "INDIVIDUAL") ? prev : "GROUP");
    }

    const first = sessionContext.entity?.individuals?.[0]?.studentId;
    if (first) setSelectedStudent((s) => s ?? first);
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

    const topLevelOverall =
      typeof existing.overallFeedback === "string" ? existing.overallFeedback : "";
    const topLevelAdminNote =
      typeof existing.adminNote === "string" ? existing.adminNote : "";

    setOverallFeedback(topLevelOverall || groupEntity?.overallFeedback || "");
    setAdminNote(topLevelAdminNote || groupEntity?.notes || "");

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

  useEffect(() => {
    const criteria = sessionContext?.assignment?.rubric?.criteria || [];
    if (!criteria.length) return;

    const individuals = sessionContext?.entity?.individuals || [];
    if (!individuals.length) return;

    const hasExistingIndividualEntities = sessionContext?.existingAssessment?.entities?.some(
      (entity) => (entity?.kind || "").toUpperCase() === "INDIVIDUAL"
    );
    if (hasExistingIndividualEntities) return;

    const hasLoadedIndividualRatings = individuals.every((student) => {
      const ratings = individualRatings?.[student.studentId];
      return ratings && Object.keys(ratings).length > 0;
    });
    if (hasLoadedIndividualRatings) return;

    const criteriaByDescription = new Map(
      criteria.map((criterion) => [
        (criterion.description || "").trim().toLowerCase(),
        criterion,
      ])
    );

    const ratingsUpdates = {};
    const commentsUpdates = {};
    let foundAnyRatings = false;

    individuals.forEach((student) => {
      const status = student?.assessmentStatus;
      if (!status?.scoresJson) return;

      let parsedScores;
      try {
        parsedScores = JSON.parse(status.scoresJson);
      } catch (error) {
        console.warn("Failed to parse individual scoresJson", {
          studentId: student?.studentId,
          error,
        });
        return;
      }

      if (!Array.isArray(parsedScores) || !parsedScores.length) return;

      parsedScores.forEach((score) => {
        const scoreType = (score?.type || "").toUpperCase();
        if (scoreType && scoreType !== "INDIVIDUAL") return;

        const key = (score?.description || "").trim().toLowerCase();
        const criterion = criteriaByDescription.get(key);
        if (!criterion) return;

        const numericPoints = Number(score?.inputPoints ?? score?.points);
        const levelId = resolveLevelIdFromScore(criterion, score);
        const range = levelId
          ? getRatingRange(sessionContext, criterion.criterionId, levelId)
          : {};

        const fallbackMin =
          range?.minPoints ??
          Number(
            score?.selectedLevel?.startPoint ??
              score?.selectedLevel?.minPoints ??
              0
          );
        const fallbackMax =
          range?.maxPoints ??
          Number(
            score?.selectedLevel?.endPoint ??
              score?.selectedLevel?.maxPoints ??
              fallbackMin
          );

        if (!ratingsUpdates[student.studentId]) {
          ratingsUpdates[student.studentId] = {};
        }

        ratingsUpdates[student.studentId][criterion.criterionId] = {
          levelId: levelId || null,
          points: Number.isFinite(numericPoints)
            ? numericPoints
            : fallbackMax,
          minPoints: Number.isFinite(range?.minPoints)
            ? range.minPoints
            : fallbackMin,
          maxPoints: Number.isFinite(range?.maxPoints)
            ? range.maxPoints
            : fallbackMax,
        };
        foundAnyRatings = true;

        const commentText =
          typeof score?.comment === "string" ? score.comment.trim() : "";
        if (commentText) {
          if (!commentsUpdates[student.studentId]) {
            commentsUpdates[student.studentId] = {};
          }
          commentsUpdates[student.studentId][criterion.criterionId] =
            commentText;
        }
      });
    });

    if (!foundAnyRatings) return;

    setIndividualRatings((prev) => {
      const merged = { ...prev };
      Object.entries(ratingsUpdates).forEach(([studentId, ratings]) => {
        merged[studentId] = { ...(merged[studentId] || {}), ...ratings };
      });
      return merged;
    });

    if (Object.keys(commentsUpdates).length) {
      setIndividualComments((prev) => {
        const merged = { ...prev };
        Object.entries(commentsUpdates).forEach(([studentId, comments]) => {
          merged[studentId] = { ...(merged[studentId] || {}), ...comments };
        });
        return merged;
      });
    }
  }, [sessionContext, individualRatings]);

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
    }),
    [
      groupRatings,
      individualRatings,
      groupComments,
      individualComments,
      overallFeedback,
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
    adminNote,
    setOverallFeedback,
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

function resolveLevelIdFromScore(criterion, score) {
  if (!criterion || !score) return null;

  const normalizeLevels = (levels) =>
    (Array.isArray(levels) ? levels : []).map((level) => ({
      levelId: level?.levelId,
      min: Number(
        level?.startPoint ??
          level?.minPoints ??
          level?.levelRange?.min ??
          0
      ),
      max: Number(
        level?.endPoint ??
          level?.maxPoints ??
          level?.levelRange?.max ??
          (level?.startPoint ?? level?.minPoints ?? 0)
      ),
      description: (level?.description || "").trim().toLowerCase(),
    }));

  const candidateLevels = normalizeLevels(
    criterion?.performanceLevel?.length
      ? criterion.performanceLevel
      : criterion?.levels
  );
  if (!candidateLevels.length) return null;

  const levelIdFromScore = score?.levelId;
  if (levelIdFromScore) {
    const direct = candidateLevels.find((lvl) => lvl.levelId === levelIdFromScore);
    if (direct) return direct.levelId;
  }

  const selected = score?.selectedLevel;
  if (selected) {
    const selectedDesc = (selected.description || "").trim().toLowerCase();
    if (selectedDesc) {
      const matchByDesc = candidateLevels.find(
        (lvl) => lvl.description === selectedDesc
      );
      if (matchByDesc) return matchByDesc.levelId;
    }

    const selectedStart = Number(
      selected.startPoint ?? selected.minPoints ?? 0
    );
    const selectedEnd = Number(
      selected.endPoint ?? selected.maxPoints ?? selectedStart
    );
    const matchByRange = candidateLevels.find(
      (lvl) => lvl.min === selectedStart && lvl.max === selectedEnd
    );
    if (matchByRange) return matchByRange.levelId;
  }

  const numericPoints = Number(score?.inputPoints ?? score?.points);
  if (Number.isFinite(numericPoints)) {
    const matchByPoints = candidateLevels.find(
      (lvl) => numericPoints >= lvl.min && numericPoints <= lvl.max
    );
    if (matchByPoints) return matchByPoints.levelId;
  }

  return candidateLevels[0].levelId || null;
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
