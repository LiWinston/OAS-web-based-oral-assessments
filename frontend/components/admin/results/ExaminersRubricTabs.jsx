"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RubricTable from "@/components/examiner/assessment/RubricTable.jsx";

const normalize = (value) => (value ?? "").toString().trim().toLowerCase();

const createCriteriaMeta = (rubricList = [], type) => {
  const criteria = [];
  const byDescription = new Map();
  const levelLookup = new Map();

  rubricList.forEach((criterion, index) => {
    const baseId = normalize(criterion?.description) || `${type}-criterion-${index}`;
    const criterionId = `${type}-${baseId}-${index}`;
    const levels = (criterion?.performanceLevels || []).map((level, levelIdx) => {
      const min = Number(level?.minPoints ?? 0);
      const max = Number(level?.maxPoints ?? min);
      const levelId = `${criterionId}-L${levelIdx + 1}`;
      return {
        levelId,
        levelLabel: level?.label || level?.description || levelId,
        description: level?.description || level?.label || levelId,
        levelRange: { min, max },
        minPoints: min,
        maxPoints: max,
      };
    });

    const mapped = {
      criterionId,
      description: criterion?.description || `Criterion ${index + 1}`,
      weight: Number(criterion?.weight ?? 0),
      appliesTo: type,
      scaleType: (criterion?.scaleType || "descriptive").toLowerCase() === "points" ? "points" : "descriptive",
      levels,
    };

    criteria.push(mapped);
    byDescription.set(normalize(criterion?.description), mapped);
    levelLookup.set(
      criterionId,
      new Map(levels.map((lvl) => [normalize(lvl.levelLabel || lvl.description), lvl]))
    );
  });

  return { criteria, byDescription, levelLookup };
};

const ensureRatings = (criteria, selectedMap) => {
  const result = { ...selectedMap };
  criteria.forEach((criterion) => {
    if (!result[criterion.criterionId]) {
      const defaultLevel = criterion.levels?.[0];
      const min = defaultLevel?.levelRange?.min ?? 0;
      const max = defaultLevel?.levelRange?.max ?? defaultLevel?.maxPoints ?? min;
      result[criterion.criterionId] = {
        levelId: defaultLevel?.levelId ?? null,
        points: 0,
        minPoints: min,
        maxPoints: max ?? min ?? 0,
      };
    }
  });
  return result;
};

const buildSelectedRatings = (scores = [], meta) => {
  const selected = {};

  scores.forEach((entry) => {
    const normalizedDesc = normalize(entry?.criterionDescription);
    const criterion = meta.byDescription.get(normalizedDesc);
    if (!criterion) return;

    const levelMap = meta.levelLookup.get(criterion.criterionId) || new Map();
    const matchedLevel = levelMap.get(normalize(entry?.selectedLevel));
    const points = Number(entry?.pointsAwarded ?? 0);
    const min = matchedLevel?.levelRange?.min ?? 0;
    const max = matchedLevel?.levelRange?.max ?? matchedLevel?.maxPoints ?? min ?? points;

    selected[criterion.criterionId] = {
      levelId: matchedLevel?.levelId ?? null,
      points,
      minPoints: min,
      maxPoints: max ?? min ?? points ?? 0,
    };
  });

  return ensureRatings(meta.criteria, selected);
};

const buildComments = (scores = [], meta) => {
  const comments = {};

  scores.forEach((entry) => {
    const normalizedDesc = normalize(entry?.criterionDescription);
    const criterion = meta.byDescription.get(normalizedDesc);
    if (!criterion) return;

    const list = Array.isArray(entry?.comments)
      ? entry.comments
      : entry?.comments && typeof entry.comments === "object"
        ? Object.values(entry.comments)
        : [];

    const texts = list
      .map((item) => (typeof item === "string" ? item : item?.text))
      .filter(Boolean);

    if (texts.length) {
      comments[criterion.criterionId] = texts.join("\n");
    }
  });

  return comments;
};

const collectStudents = (examiners = [], participant) => {
  const map = new Map();

  if (participant?.members) {
    participant.members.forEach((member) => {
      if (member?.studentId == null) return;
      map.set(Number(member.studentId), {
        studentId: Number(member.studentId),
        name: member.name || `Student ${member.studentId}`,
      });
    });
  }

  examiners.forEach((examiner) => {
    (examiner?.rubricScores?.individual || []).forEach((score) => {
      if (score?.studentId == null) return;
      const id = Number(score.studentId);
      if (!map.has(id)) {
        map.set(id, {
          studentId: id,
          name: score.studentName || `Student ${score.studentId}`,
        });
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => a.studentId - b.studentId);
};

const ExaminerCard = ({ examiner, criteriaMeta, assessmentType, scoreUnit, selectedStudentId }) => {
  const scores = useMemo(() => {
    if (assessmentType === "GROUP") {
      return examiner?.rubricScores?.group || [];
    }
    return (examiner?.rubricScores?.individual || []).filter((entry) => {
      if (selectedStudentId == null) return true;
      return Number(entry?.studentId) === Number(selectedStudentId);
    });
  }, [assessmentType, examiner?.rubricScores, selectedStudentId]);

  const selectedRatings = useMemo(
    () => buildSelectedRatings(scores, criteriaMeta),
    [scores, criteriaMeta]
  );

  const comments = useMemo(() => buildComments(scores, criteriaMeta), [scores, criteriaMeta]);

  const hasScores = scores && scores.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-5 space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <i className="fas fa-user-tie text-blue-500" />
            {examiner?.examinerName || `Examiner ${examiner?.examinerId ?? ""}`}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {examiner?.assessmentStatus || "UNKNOWN"}
            </span>
            {examiner?.submittedAt && (
              <span className="inline-flex items-center gap-1">
                <i className="far fa-clock" /> Submitted: {new Date(examiner.submittedAt).toLocaleString()}
              </span>
            )}
            {examiner?.reopenedAt && (
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-undo" /> Reopened: {new Date(examiner.reopenedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-gray-50">Total score:</span> {examiner?.totalScore ?? "—"}
        </div>
      </header>

      {hasScores ? (
        <RubricTable
          criteria={criteriaMeta.criteria}
          selectedRatings={selectedRatings}
          comments={comments}
          onRatingChange={() => {}}
          onCommentChange={() => {}}
          disabled
          assessmentType={assessmentType}
          showTotals={false}
          scoreUnit={scoreUnit}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          No rubric scores recorded for this {assessmentType === "GROUP" ? "group" : "student"}.
        </div>
      )}

      {examiner?.overallFeedback && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <i className="fas fa-comment-dots" /> Overall feedback
          </h4>
          <p className="whitespace-pre-wrap leading-relaxed">{examiner.overallFeedback}</p>
        </section>
      )}
    </div>
  );
};

const StudentSelector = ({ students, selectedStudentId, onChange }) => {
  if (!students || students.length === 0) return null;

  if (students.length === 1) {
    const only = students[0];
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        Viewing individual rubric for {only.name} (ID: {only.studentId})
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-4 space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="admin-individual-student-select">
          Select student
        </label>
        <select
          id="admin-individual-student-select"
          value={selectedStudentId ?? ""}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full md:w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
        >
          {students.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.name} (ID: {student.studentId})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {students.map((student) => {
          const isActive = Number(student.studentId) === Number(selectedStudentId);
          return (
            <button
              key={`pill-${student.studentId}`}
              type="button"
              onClick={() => onChange(student.studentId)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10"
                  : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900"
              }`}
            >
              {student.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function ExaminersRubricTabs({ rubricSnapshot, examiners = [], participant, weightBasis = "points" }) {
  const groupMeta = useMemo(
    () => createCriteriaMeta(rubricSnapshot?.groupRubrics || [], "GROUP"),
    [rubricSnapshot?.groupRubrics]
  );
  const individualMeta = useMemo(
    () => createCriteriaMeta(rubricSnapshot?.individualRubrics || [], "INDIVIDUAL"),
    [rubricSnapshot?.individualRubrics]
  );

  const scoreUnit = (weightBasis || "").toLowerCase() === "percentage" ? "%" : "pts";

  const hasGroupTab = groupMeta.criteria.length > 0 && examiners.some((ex) => (ex?.rubricScores?.group || []).length > 0);
  const hasIndividualTab = individualMeta.criteria.length > 0 && examiners.some((ex) => (ex?.rubricScores?.individual || []).length > 0);

  const initialTab = hasGroupTab ? "group" : "individual";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (activeTab === "group" && !hasGroupTab && hasIndividualTab) {
      setActiveTab("individual");
    }
    if (activeTab === "individual" && !hasIndividualTab && hasGroupTab) {
      setActiveTab("group");
    }
  }, [activeTab, hasGroupTab, hasIndividualTab]);

  const students = useMemo(() => collectStudents(examiners, participant), [examiners, participant]);
  const [selectedStudentId, setSelectedStudentId] = useState(() => students[0]?.studentId ?? null);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!students.some((student) => Number(student.studentId) === Number(selectedStudentId))) {
      setSelectedStudentId(students[0].studentId);
    }
  }, [students, selectedStudentId]);

  if (!hasGroupTab && !hasIndividualTab) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No rubric data available for this participant.
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="flex w-fit bg-blue-50/60 dark:bg-blue-900/20 p-1 rounded-lg">
        {hasGroupTab && (
          <TabsTrigger value="group" className="px-4 py-2 text-sm">
            Group rubric
          </TabsTrigger>
        )}
        {hasIndividualTab && (
          <TabsTrigger value="individual" className="px-4 py-2 text-sm">
            Individual rubric
          </TabsTrigger>
        )}
      </TabsList>

      {hasGroupTab && (
        <TabsContent value="group" className="space-y-4">
          {examiners.map((examiner, index) => (
            <ExaminerCard
              key={examiner?.examinerId ?? `group-examiner-${index}`}
              examiner={examiner}
              criteriaMeta={groupMeta}
              assessmentType="GROUP"
              scoreUnit={scoreUnit}
            />
          ))}
        </TabsContent>
      )}

      {hasIndividualTab && (
        <TabsContent value="individual" className="space-y-4">
          <StudentSelector
            students={students}
            selectedStudentId={selectedStudentId}
            onChange={setSelectedStudentId}
          />

          {examiners.map((examiner, index) => (
            <ExaminerCard
              key={examiner?.examinerId ?? `individual-examiner-${index}`}
              examiner={examiner}
              criteriaMeta={individualMeta}
              assessmentType="INDIVIDUAL"
              scoreUnit={scoreUnit}
              selectedStudentId={selectedStudentId}
            />
          ))}
        </TabsContent>
      )}
    </Tabs>
  );
}
