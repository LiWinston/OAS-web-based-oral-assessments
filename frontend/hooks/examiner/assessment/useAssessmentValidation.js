"use client";

import { useMemo } from "react";

export function useAssessmentValidation(sessionContext, groupRatings, individualRatings) {
  const validation = useMemo(() => {
    if (!sessionContext?.assignment?.rubric?.criteria) {
      return {
        totalMissing: 0,
        groupMissing: 0,
        groupRequired: 0,
        perStudentMissing: [],
      };
    }
    const criteria = sessionContext.assignment.rubric.criteria;
    const applies = (criterion, target) => {
      const a = criterion.appliesTo || "BOTH";
      if (target === "GROUP") return a === "GROUP" || a === "BOTH";
      if (target === "INDIVIDUAL") return a === "INDIVIDUAL" || a === "BOTH";
      return true;
    };

    // Group side (for group or mixed)
    let groupMissing = 0;
    let groupRequired = 0;
    if (
      sessionContext.assignment.type === "group" ||
      sessionContext.assignment.type === "mixed"
    ) {
      const groupCriteria = criteria.filter((c) => applies(c, "GROUP"));
      groupRequired = groupCriteria.length;
      groupMissing = groupCriteria.reduce(
        (acc, c) => acc + (groupRatings?.[c.criterionId]?.levelId ? 0 : 1),
        0
      );
    }

    // Individual side (for individual or mixed)
    const perStudentMissing = [];
    if (
      sessionContext.assignment.type === "individual" ||
      sessionContext.assignment.type === "mixed"
    ) {
      const individualCriteria = criteria.filter((c) => applies(c, "INDIVIDUAL"));
      const students = sessionContext.entity?.individuals || [];
      for (const stu of students) {
        const ratings = individualRatings?.[stu.studentId] || {};
        const missing = individualCriteria.reduce(
          (acc, c) => acc + (ratings?.[c.criterionId]?.levelId ? 0 : 1),
          0
        );
        perStudentMissing.push({
          studentId: stu.studentId,
          name: stu.name,
          missing,
          required: individualCriteria.length,
        });
      }
    }

    const totalMissing = groupMissing + perStudentMissing.reduce((s, i) => s + i.missing, 0);
    return { totalMissing, groupMissing, groupRequired, perStudentMissing };
  }, [sessionContext, groupRatings, individualRatings]);

  const isAllStudentsComplete = useMemo(() => {
    const type = sessionContext?.assignment?.type;
    if (!(type === "individual" || type === "mixed")) return false;
    const per = validation.perStudentMissing || [];
    if (!per.length) return false;
    const relevant = per.filter((s) => s.required > 0);
    if (!relevant.length) return false;
    return relevant.every((s) => s.missing === 0);
  }, [sessionContext, validation]);

  return { validation, isAllStudentsComplete };
}

