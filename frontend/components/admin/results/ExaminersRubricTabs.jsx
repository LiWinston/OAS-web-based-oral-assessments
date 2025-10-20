"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import RubricTable from "@/components/examiner/assessment/RubricTable.jsx";

const STATUS_META = {
  SUBMITTED: {
    label: "Submitted",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/60",
    icon: "fa-circle-check",
  },
  REOPENED: {
    label: "Reopened",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
    icon: "fa-rotate-left",
  },
  DRAFT: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700/60",
    icon: "fa-pencil",
  },
  UNKNOWN: {
    label: "Unknown",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/60",
    icon: "fa-question-circle",
  },
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalize = (value) => (value ?? "").toString().trim().toLowerCase();

const createCriteriaMeta = (rubricList = [], type) => {
  const criteria = [];
  const byDescription = new Map();
  const levelLookup = new Map();

  rubricList.forEach((criterion, index) => {
    const baseId = normalize(criterion?.description) || `${type}-criterion-${index}`;
    const criterionId = `${type}-${baseId}-${index}`;
    const levels = safeArray(criterion?.performanceLevels).map((level, levelIdx) => {
      const min = coerceNumber(level?.minPoints ?? level?.levelRange?.min ?? 0) ?? 0;
      const max = coerceNumber(level?.maxPoints ?? level?.levelRange?.max ?? min) ?? min;
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
      weight: coerceNumber(criterion?.weight) ?? 0,
      appliesTo: type,
      scaleType:
        (criterion?.scaleType || "descriptive").toLowerCase() === "points"
          ? "points"
          : "descriptive",
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
      const max = defaultLevel?.levelRange?.max ?? min;
      result[criterion.criterionId] = {
        levelId: defaultLevel?.levelId ?? null,
        points: null,
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
    const points = coerceNumber(entry?.pointsAwarded);
    const min = matchedLevel?.levelRange?.min ?? 0;
    const max = matchedLevel?.levelRange?.max ?? matchedLevel?.maxPoints ?? min ?? points ?? 0;

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

    const list = safeArray(entry?.comments).map((item) =>
      typeof item === "string" ? item : item && typeof item.text === "string" ? item.text : null
    );

    const texts = list.filter(Boolean);
    if (texts.length) {
      comments[criterion.criterionId] = texts.join("\n");
    }
  });

  return comments;
};

const collectStudents = (examiners = [], participant) => {
  const map = new Map();

  safeArray(participant?.members).forEach((member) => {
    if (member?.studentId == null) return;
    const key = Number(member.studentId);
    map.set(key, {
      studentId: key,
      name: member?.name || `Student ${key}`,
      finalScore: coerceNumber(member?.finalScore),
    });
  });

  safeArray(examiners).forEach((examiner) => {
    safeArray(examiner?.rubricScores?.individual).forEach((studentEntry) => {
      if (studentEntry?.studentId == null) return;
      const key = Number(studentEntry.studentId);
      const existing = map.get(key);
      map.set(key, {
        studentId: key,
        name: studentEntry?.studentName || existing?.name || `Student ${key}`,
        finalScore: existing?.finalScore ?? coerceNumber(studentEntry?.finalScore),
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => a.studentId - b.studentId);
};

const formatDateTime = (value) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  } catch (error) {
    return value;
  }
};

const formatScore = (value, scoreUnit) => {
  const numeric = coerceNumber(value);
  if (numeric === null) return "—";
  return `${numeric.toFixed(2)}${scoreUnit || ""}`.trim();
};

const ExaminerStatusBadge = ({ status }) => {
  const normalized = (status || "UNKNOWN").toString().toUpperCase();
  const meta = STATUS_META[normalized] ?? STATUS_META.UNKNOWN;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold", meta.className)}>
      <i className={`fas ${meta.icon} text-[10px]`} />
      {meta.label}
    </span>
  );
};

const StudentSelector = ({ students, selectedStudentId, onChange }) => {
  if (!students || students.length === 0) return null;

  if (students.length === 1) {
    const only = students[0];
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        Viewing individual rubric for {only.name}
        {only.finalScore != null && (
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            Final score: {only.finalScore.toFixed(2)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-4 space-y-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Select student</div>
      <div className="flex flex-wrap gap-2">
        {students.map((student) => {
          const isActive = Number(student.studentId) === Number(selectedStudentId);
          return (
            <button
              key={student.studentId}
              type="button"
              onClick={() => onChange(student.studentId)}
              className={cn(
                "text-xs px-3 py-1 rounded-full border transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10"
                  : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900"
              )}
            >
              <span>{student.name}</span>
              {student.finalScore != null && (
                <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">
                  {student.finalScore.toFixed(2)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ExaminerDetail = ({
  examiner,
  groupMeta,
  individualMeta,
  hasGroupRubric,
  hasIndividualRubric,
  students,
  scoreUnit,
  renderExaminerActions,
}) => {
  const groupScores = safeArray(examiner?.rubricScores?.group);
  const individualEntries = safeArray(examiner?.rubricScores?.individual);

  const studentOptions = useMemo(() => {
    if (!students || students.length === 0) {
      return individualEntries.map((entry) => ({
        studentId: entry?.studentId ?? null,
        name: entry?.studentName || (entry?.studentId != null ? `Student ${entry.studentId}` : "Student"),
        finalScore: coerceNumber(entry?.finalScore),
        entry,
      }));
    }

    const enriched = students.map((student) => {
      const match = individualEntries.find((entry) => Number(entry?.studentId) === Number(student.studentId));
      return {
        ...student,
        entry: match || null,
      };
    });

    const additional = individualEntries.filter((entry) => {
      if (entry?.studentId == null) return false;
      return !enriched.some((student) => Number(student.studentId) === Number(entry.studentId));
    });

    return enriched.concat(
      additional.map((entry) => ({
        studentId: entry?.studentId,
        name: entry?.studentName || `Student ${entry.studentId}`,
        finalScore: coerceNumber(entry?.finalScore),
        entry,
      }))
    );
  }, [students, individualEntries]);

  const [activeRubricTab, setActiveRubricTab] = useState(() => (hasGroupRubric ? "group" : "individual"));

  useEffect(() => {
    if (activeRubricTab === "group" && !hasGroupRubric && hasIndividualRubric) {
      setActiveRubricTab("individual");
    }
    if (activeRubricTab === "individual" && !hasIndividualRubric && hasGroupRubric) {
      setActiveRubricTab("group");
    }
  }, [activeRubricTab, hasGroupRubric, hasIndividualRubric]);

  const [selectedStudentId, setSelectedStudentId] = useState(() => studentOptions[0]?.studentId ?? null);

  useEffect(() => {
    if (!studentOptions || studentOptions.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!studentOptions.some((student) => Number(student.studentId) === Number(selectedStudentId))) {
      setSelectedStudentId(studentOptions[0]?.studentId ?? null);
    }
  }, [studentOptions, selectedStudentId]);

  const selectedStudent = selectedStudentId == null
    ? null
    : studentOptions.find((student) => Number(student.studentId) === Number(selectedStudentId));

  const groupRatings = useMemo(
    () => buildSelectedRatings(groupScores, groupMeta),
    [groupScores, groupMeta]
  );

  const groupComments = useMemo(
    () => buildComments(groupScores, groupMeta),
    [groupScores, groupMeta]
  );

  const individualScores = useMemo(
    () => safeArray(selectedStudent?.entry?.scores),
    [selectedStudent]
  );

  const individualRatings = useMemo(
    () => buildSelectedRatings(individualScores, individualMeta),
    [individualScores, individualMeta]
  );

  const individualComments = useMemo(
    () => buildComments(individualScores, individualMeta),
    [individualScores, individualMeta]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <i className="fas fa-user-tie text-blue-500" />
              {examiner?.examinerName || `Examiner ${examiner?.examinerId ?? ""}`}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <ExaminerStatusBadge status={examiner?.assessmentStatus} />
              {examiner?.submittedAt && (
                <span className="inline-flex items-center gap-1">
                  <i className="far fa-clock" /> Submitted: {formatDateTime(examiner.submittedAt)}
                </span>
              )}
              {examiner?.reopenedAt && (
                <span className="inline-flex items-center gap-1">
                  <i className="fas fa-undo" /> Reopened: {formatDateTime(examiner.reopenedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-gray-50">Total score: </span>
              {formatScore(examiner?.totalScore, scoreUnit)}
            </div>
            {renderExaminerActions && (
              <div className="flex flex-wrap gap-2">{renderExaminerActions(examiner)}</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Badge variant="outline" className="border-blue-200 text-blue-600 dark:border-blue-700 dark:text-blue-300">
            Submission ID: {examiner?.submissionId ?? "—"}
          </Badge>
          <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300">
            Examiner ID: {examiner?.examinerId ?? "—"}
          </Badge>
        </div>
      </div>

      {(hasGroupRubric || hasIndividualRubric) ? (
        <Tabs value={activeRubricTab} onValueChange={setActiveRubricTab} className="space-y-4">
          <TabsList className="flex w-fit bg-blue-50/60 dark:bg-blue-900/20 p-1 rounded-lg">
            {hasGroupRubric && (
              <TabsTrigger value="group" className="px-4 py-2 text-sm">
                Group rubric
              </TabsTrigger>
            )}
            {hasIndividualRubric && (
              <TabsTrigger value="individual" className="px-4 py-2 text-sm">
                Individual rubric
              </TabsTrigger>
            )}
          </TabsList>

          {hasGroupRubric && (
            <TabsContent value="group" className="space-y-4">
              {groupScores.length > 0 ? (
                <RubricTable
                  criteria={groupMeta.criteria}
                  selectedRatings={groupRatings}
                  comments={groupComments}
                  onRatingChange={() => {}}
                  onCommentChange={() => {}}
                  disabled
                  assessmentType="GROUP"
                  showTotals={false}
                  scoreUnit={scoreUnit}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No group rubric scores recorded by this examiner.
                </div>
              )}
            </TabsContent>
          )}

          {hasIndividualRubric && (
            <TabsContent value="individual" className="space-y-4">
              <StudentSelector
                students={studentOptions}
                selectedStudentId={selectedStudentId}
                onChange={setSelectedStudentId}
              />

              {individualScores.length > 0 ? (
                <RubricTable
                  criteria={individualMeta.criteria}
                  selectedRatings={individualRatings}
                  comments={individualComments}
                  onRatingChange={() => {}}
                  onCommentChange={() => {}}
                  disabled
                  assessmentType="INDIVIDUAL"
                  showTotals={false}
                  scoreUnit={scoreUnit}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  {selectedStudent
                    ? `No individual rubric scores recorded for ${selectedStudent.name}.`
                    : "Select a student to view individual rubric scores."}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          No rubric configuration available for this assignment.
        </div>
      )}

      {examiner?.overallFeedback && (
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <i className="fas fa-comment-dots" /> Overall feedback
          </h3>
          <p className="whitespace-pre-wrap leading-relaxed">{examiner.overallFeedback}</p>
        </section>
      )}
    </div>
  );
};

export default function ExaminersRubricTabs({
  examiners = [],
  rubricSnapshot,
  participant,
  students = [],
  renderExaminerActions,
}) {
  const hasExaminers = Array.isArray(examiners) && examiners.length > 0;

  const groupMeta = useMemo(
    () => createCriteriaMeta(safeArray(rubricSnapshot?.groupRubrics), "GROUP"),
    [rubricSnapshot?.groupRubrics]
  );
  const individualMeta = useMemo(
    () => createCriteriaMeta(safeArray(rubricSnapshot?.individualRubrics), "INDIVIDUAL"),
    [rubricSnapshot?.individualRubrics]
  );

  const hasGroupRubric = groupMeta.criteria.length > 0;
  const hasIndividualRubric = individualMeta.criteria.length > 0;

  const combinedStudents = useMemo(() => {
    if (students && students.length > 0) return students;
    return collectStudents(examiners, participant);
  }, [students, examiners, participant]);

  const scoreUnit = useMemo(() => {
    const basis = (rubricSnapshot?.weightBasis || "").toString().toLowerCase();
    return basis === "percentage" ? "%" : "pts";
  }, [rubricSnapshot?.weightBasis]);

  const initialValue = useMemo(() => {
    const first = examiners[0];
    return (first?.submissionId ?? first?.examinerId ?? "examiner-0").toString();
  }, [examiners]);

  const [activeExaminerId, setActiveExaminerId] = useState(initialValue);

  useEffect(() => {
    const exists = examiners.some((examiner) => {
      const key = (examiner?.submissionId ?? examiner?.examinerId ?? "").toString();
      return key === activeExaminerId;
    });
    if (!exists) {
      setActiveExaminerId(initialValue);
    }
  }, [examiners, activeExaminerId, initialValue]);

  if (!hasExaminers) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No examiner submissions yet.
      </div>
    );
  }

  return (
    <Tabs value={activeExaminerId} onValueChange={setActiveExaminerId} className="space-y-6">
      <TabsList className="flex w-full flex-wrap gap-2 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl">
        {examiners.map((examiner) => {
          const key = (examiner?.submissionId ?? examiner?.examinerId ?? "").toString();
          return (
            <TabsTrigger
              key={key}
              value={key}
              className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-blue-200 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <i className="fas fa-user" />
                {examiner?.examinerName || `Examiner ${examiner?.examinerId ?? ""}`}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {examiners.map((examiner) => {
        const key = (examiner?.submissionId ?? examiner?.examinerId ?? "").toString();
        return (
          <TabsContent key={key} value={key} className="space-y-6">
            <ExaminerDetail
              examiner={examiner}
              groupMeta={groupMeta}
              individualMeta={individualMeta}
              hasGroupRubric={hasGroupRubric}
              hasIndividualRubric={hasIndividualRubric}
              students={combinedStudents}
              scoreUnit={scoreUnit}
              renderExaminerActions={renderExaminerActions}
            />
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
