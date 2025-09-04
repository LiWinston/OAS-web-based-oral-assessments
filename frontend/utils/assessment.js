export function buildAssessmentPayload({
  sessionContext,
  examinerId,
  status,
  groupRatings,
  individualRatings,
  groupComments,
  individualComments,
  overallFeedback,
  privateNotes,
}) {
  const entities = [];

  // Add group entity for GROUP or MIXED assignments
  if (
    sessionContext?.entity?.kind === "GROUP" ||
    sessionContext?.assignment?.type === "mixed"
  ) {
    const groupItems = Object.entries(groupRatings || {}).map(
      ([criterionId, rating]) => {
        const comments = [];
        const text = groupComments?.[criterionId];
        if (text && String(text).trim()) {
          comments.push({ source: "custom", text: String(text).trim() });
        }
        return {
          criterionId,
          levelId: rating.levelId,
          points: rating.points,
          comments,
        };
      }
    );

    entities.push({
      kind: "GROUP",
      groupId: sessionContext?.entity?.group?.groupId,
      overallFeedback,
      notes: privateNotes,
      items: groupItems,
    });
  }

  // Add per-student entities for INDIVIDUAL or MIXED assignments
  if (
    sessionContext?.assignment?.type === "individual" ||
    sessionContext?.assignment?.type === "mixed"
  ) {
    const students = sessionContext?.entity?.individuals || [];
    students.forEach((student) => {
      const ratings = (individualRatings || {})[student.studentId] || {};
      const commentsMap = (individualComments || {})[student.studentId] || {};
      const items = Object.entries(ratings).map(([criterionId, rating]) => {
        const comments = [];
        const text = commentsMap?.[criterionId];
        if (text && String(text).trim()) {
          comments.push({ source: "custom", text: String(text).trim() });
        }
        return {
          criterionId,
          levelId: rating.levelId,
          points: rating.points,
          comments,
        };
      });
      if (items.length) {
        entities.push({ kind: "INDIVIDUAL", studentId: student.studentId, items });
      }
    });
  }

  return {
    examinerId,
    assignmentId: sessionContext?.assignment?.id,
    status,
    entities,
  };
}

