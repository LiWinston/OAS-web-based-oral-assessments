"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";

const STATUS_META = {
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/60",
  },
  REOPENED: {
    label: "Reopened",
    className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700/60",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
  },
};

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  try {
    const date = new Date(isoString);
    return date.toLocaleString();
  } catch (error) {
    return isoString;
  }
};

const formatPoints = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "—";
};

function StatusBadge({ status }) {
  const normalized = (status || "DRAFT").toString().trim().toUpperCase();
  const meta = STATUS_META[normalized] || STATUS_META.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <i className="fas fa-clipboard-check text-[10px]" />
      {meta.label}
    </span>
  );
}

function GroupScoresTable({ scores }) {
  if (!scores || scores.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <i className="fas fa-users" /> Group rubric
      </h3>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3">Criterion</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {scores.map((score, index) => (
              <tr key={`${score.criterionDescription ?? index}` } className="text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 align-top">{score.criterionDescription || "—"}</td>
                <td className="px-4 py-3 align-top">{score.selectedLevel || "—"}</td>
                <td className="px-4 py-3 align-top">{formatPoints(score.pointsAwarded)}</td>
                <td className="px-4 py-3 align-top">
                  {Array.isArray(score.comments) && score.comments.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {score.comments.map((comment, commentIndex) => (
                        <li key={`${comment}-${commentIndex}`}>{comment}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndividualScoresTables({ scores }) {
  const grouped = useMemo(() => {
    if (!scores || scores.length === 0) return [];
    const map = new Map();
    scores.forEach((score, index) => {
      const key = score.studentId ?? score.studentName ?? `student-${index}`;
      if (!map.has(key)) {
        map.set(key, {
          studentId: score.studentId,
          studentName: score.studentName,
          rows: [],
        });
      }
      map.get(key).rows.push(score);
    });
    return Array.from(map.values());
  }, [scores]);

  if (grouped.length === 0) return null;

  return (
    <div className="space-y-4">
      {grouped.map((student) => (
        <div key={student.studentId ?? student.studentName} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <i className="fas fa-user" /> {student.studentName || `Student ${student.studentId ?? ""}`}
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3">Criterion</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {student.rows.map((row, rowIndex) => (
                  <tr key={`${row.criterionDescription ?? rowIndex}`} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 align-top">{row.criterionDescription || "—"}</td>
                    <td className="px-4 py-3 align-top">{row.selectedLevel || "—"}</td>
                    <td className="px-4 py-3 align-top">{formatPoints(row.pointsAwarded)}</td>
                    <td className="px-4 py-3 align-top">
                      {Array.isArray(row.comments) && row.comments.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {row.comments.map((comment, commentIndex) => (
                            <li key={`${comment}-${commentIndex}`}>{comment}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExaminerPanel({ examiner, onReview }) {
  const groupScores = examiner?.rubricScores?.group ?? [];
  const individualScores = examiner?.rubricScores?.individual ?? [];

  const canRequestReview = typeof onReview === "function" && examiner?.assessmentStatus === "SUBMITTED";

  return (
    <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-5 py-5 space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <i className="fas fa-user-tie text-blue-500" />
            {examiner?.examinerName || `Examiner ${examiner?.examinerId ?? ""}`}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <StatusBadge status={examiner?.assessmentStatus} />
            <span className="inline-flex items-center gap-1">
              <i className="far fa-clock" /> Submitted: {formatDateTime(examiner?.submittedAt)}
            </span>
            {examiner?.reopenedAt && (
              <span className="inline-flex items-center gap-1">
                <i className="fas fa-undo" /> Reopened: {formatDateTime(examiner.reopenedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-50">Total score:</span> {formatPoints(examiner?.totalScore)}
          </div>
          {canRequestReview && (
            <Button size="sm" variant="outline" onClick={() => onReview?.(examiner)}>
              <i className="fas fa-rotate-left mr-2" /> Request review
            </Button>
          )}
        </div>
      </header>

      {examiner?.overallFeedback && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
            <i className="fas fa-comment-dots" /> Overall feedback
          </h3>
          <p className="whitespace-pre-wrap leading-relaxed">{examiner.overallFeedback}</p>
        </section>
      )}

      <section className="space-y-4">
        <GroupScoresTable scores={groupScores} />
        <IndividualScoresTables scores={individualScores} />
      </section>
    </article>
  );
}
