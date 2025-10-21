"use client";

import Link from "next/link";
import { formatDateRangeWithTimezone } from "@/lib/datetime.js";
import { ReleaseStatusBadge } from "@/components/admin/results/ReleaseStatusBadge.jsx";

const progressMeta = {
  ready: {
    label: "Ready",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50",
    icon: "fa-circle-check",
  },
  attention: {
    label: "Needs attention",
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800/50",
    icon: "fa-triangle-exclamation",
  },
  incomplete: {
    label: "Awaiting",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
    icon: "fa-hourglass-half",
  },
  unknown: {
    label: "—",
    className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/60",
    icon: "fa-circle",
  },
};

const examinerStatusMeta = {
  SUBMITTED: { icon: "fa-check", tone: "text-emerald-600" },
  DRAFT: { icon: "fa-pen", tone: "text-amber-600" },
  REOPENED: { icon: "fa-rotate-left", tone: "text-rose-600" },
  UNKNOWN: { icon: "fa-question-circle", tone: "text-gray-400" },
};

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return `${numeric.toFixed(1)}%`;
};

function ProgressBadge({ status }) {
  const meta = progressMeta[status] ?? progressMeta.unknown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <i className={`fas ${meta.icon} text-[10px]`} />
      {meta.label}
    </span>
  );
}

function ExaminerChip({ examiner }) {
  const status = examiner?.status?.toUpperCase?.() ?? "UNKNOWN";
  const meta = examinerStatusMeta[status] ?? examinerStatusMeta.UNKNOWN;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
      <i className={`fas ${meta.icon} ${meta.tone}`} />
      <span className="truncate max-w-[120px]">{examiner?.examinerName || `Examiner ${examiner?.examinerId ?? ""}`}</span>
    </span>
  );
}

function buildDetailHref(courseId, assignmentId, participant) {
  if (!courseId || !assignmentId || !participant?.id) return "#";
  const base = `/admin/courses/${courseId}/assignments/${assignmentId}/results`;
  if (participant.type === "GROUP") {
    return `${base}/group/${participant.id}`;
  }
  return `${base}/individual/${participant.id}`;
}

function buildDetailHrefWithSession(courseId, assignmentId, participant, sessionId) {
  const base = buildDetailHref(courseId, assignmentId, participant);
  if (!sessionId) return base;
  return `${base}?sessionId=${sessionId}`;
}

function ParticipantBadge({ participant }) {
  if (!participant) return null;
  const isGroup = participant.type === "GROUP";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${isGroup ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"}`}>
      <i className={`fas ${isGroup ? "fa-users" : "fa-user"}`} />
      {isGroup ? "Group" : "Individual"}
    </span>
  );
}

export default function MarkConsolidationAssessmentsTable({
  assessments,
  sortBy,
  sortDirection,
  onSortChange,
  courseId,
  assignmentId,
}) {
  const handleSort = (key) => {
    if (!onSortChange) return;
    if (sortBy === key) {
      onSortChange(key, sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  if (!assessments || assessments.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        No assessments match the current filters.
      </div>
    );
  }

  const sortedIndicator = (key) => {
    if (sortBy !== key) return null;
    return <i className={`fas ${sortDirection === "asc" ? "fa-sort-up" : "fa-sort-down"} text-xs text-blue-500`} />;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50/80 dark:bg-gray-800/60">
          <tr className="text-[11px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            <th className="px-4 py-3 text-left">
              <button type="button" onClick={() => handleSort("participant")} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-300">
                Participant {sortedIndicator("participant")}
              </button>
            </th>
            <th className="px-4 py-3 text-left">
              <button type="button" onClick={() => handleSort("session")} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-300">
                Session {sortedIndicator("session")}
              </button>
            </th>
            <th className="px-4 py-3 text-left">Progress</th>
            <th className="px-4 py-3 text-left">Release</th>
            <th className="px-4 py-3 text-left">
              <button type="button" onClick={() => handleSort("score")} className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-300">
                Final score {sortedIndicator("score")}
              </button>
            </th>
            <th className="px-4 py-3 text-left">Examiners</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700 dark:divide-gray-800 dark:bg-transparent dark:text-gray-300">
          {assessments.map((assessment) => {
            const participant = assessment.participant;
            const session = assessment.session;
            const displaySession = session
              ? formatDateRangeWithTimezone(
                  session.start,
                  session.end,
                  session.timezone || "Australia/Melbourne"
                )
              : "Session pending";

            const detailHref = buildDetailHrefWithSession(
              courseId,
              assignmentId,
              participant,
              assessment.key?.sessionId
            );

            const summary = assessment.examinerSummary ?? {};
            const remaining = Math.max((summary.total ?? 0) - (summary.submitted ?? 0) - (summary.reopened ?? 0), 0);

            const examinerChips = assessment.examiners.slice(0, 3);
            const extraCount = Math.max(assessment.examiners.length - examinerChips.length, 0);

            return (
              <tr key={assessment.id} className="transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                <td className="px-4 py-4 align-top">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{participant?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {participant?.id ?? "—"}</div>
                      </div>
                      <ParticipantBadge participant={participant} />
                    </div>
                    {participant?.memberCount ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {participant.memberCount} member{participant.memberCount === 1 ? "" : "s"}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                  <div className="space-y-1">
                    <div>{displaySession}</div>
                    {session?.venue && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <i className="fas fa-location-dot" />
                        {session.venue.name || `Venue ${session.venue.venueId ?? ""}`}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <ProgressBadge status={assessment.progressStatus} />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{summary.submitted ?? 0}</span>
                      /{summary.total ?? 0} submitted
                      {summary.reopened ? (
                        <span className="ml-2 text-rose-600 dark:text-rose-400">{summary.reopened} reopened</span>
                      ) : null}
                      {remaining ? (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">{remaining} pending</span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <ReleaseStatusBadge status={assessment.releaseStatus} />
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatScore(assessment.computed?.effectiveFinalScore)}
                    </div>
                    {assessment.computed?.manualOverride ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                        <i className="fas fa-pen" /> Manual override
                      </span>
                    ) : null}
                    {typeof assessment.computed?.averageScore === "number" && !assessment.computed?.manualOverride ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Avg: {formatScore(assessment.computed?.averageScore)}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {examinerChips.map((examiner) => (
                        <ExaminerChip key={`${assessment.id}-${examiner.examinerId}`} examiner={examiner} />
                      ))}
                      {extraCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-800/60 dark:text-gray-300">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <Link
                    href={detailHref}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    View detail <i className="fas fa-arrow-right" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
