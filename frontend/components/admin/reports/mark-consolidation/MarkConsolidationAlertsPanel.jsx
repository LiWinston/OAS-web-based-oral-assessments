"use client";

import Link from "next/link";
import { formatDateRangeWithTimezone } from "@/lib/datetime.js";

const toneMeta = {
  REOPENED: { badge: "bg-amber-100 text-amber-700", icon: "fa-rotate-left" },
  OVERDUE: { badge: "bg-rose-100 text-rose-700", icon: "fa-clock" },
  MISSING_EXAMINER: { badge: "bg-indigo-100 text-indigo-700", icon: "fa-user-slash" },
  MANUAL_OVERRIDE_PENDING: { badge: "bg-purple-100 text-purple-700", icon: "fa-pen" },
  DEFAULT: { badge: "bg-blue-100 text-blue-700", icon: "fa-circle-exclamation" },
};

const buildDetailHref = (courseId, assignmentId, participantId, participantType, sessionId) => {
  if (!courseId || !assignmentId || !participantId) return "#";
  const base = `/admin/courses/${courseId}/assignments/${assignmentId}/results`;
  const target = participantType === "GROUP" ? "group" : "individual";
  const url = `${base}/${target}/${participantId}`;
  if (!sessionId) return url;
  return `${url}?sessionId=${sessionId}`;
};

const formatSessionLabel = (session, timezone) => {
  if (!session?.start || !session?.end) return session?.venueName || "Session";
  return formatDateRangeWithTimezone(session.start, session.end, timezone || "Australia/Melbourne");
};

export default function MarkConsolidationAlertsPanel({
  alerts,
  isLoading,
  courseId,
  assignmentId,
  timezone,
}) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Attention board</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Participants needing follow-up</h3>
        </div>
        {isLoading && (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-500" />
            Loading
          </span>
        )}
      </div>

      {!hasAlerts && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
          {isLoading ? "Looking for alerts…" : "Great news—no participants require immediate attention."}
        </div>
      )}

      {hasAlerts && (
        <ul className="mt-5 space-y-4">
          {alerts.map((alert) => {
            const meta = toneMeta[alert.alertType] || toneMeta.DEFAULT;
            const sessionLabel = formatSessionLabel(alert.participant?.session, timezone);
            const href = buildDetailHref(
              courseId,
              assignmentId,
              alert.participant?.id,
              alert.participant?.type,
              alert.participant?.session?.id
            );

            return (
              <li
                key={`${alert.alertType}-${alert.participant?.id}-${alert.lastUpdatedAt}`}
                className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${meta.badge}`}>
                      <i className={`fas ${meta.icon}`} />
                      {alert.alertType || "Attention"}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {alert.participant?.name || "Participant"}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                      {alert.participant?.type === "GROUP" ? "Group" : "Individual"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {alert.lastUpdatedAt ? new Date(alert.lastUpdatedAt).toLocaleString("en-AU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "recently"}
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {sessionLabel && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">
                      <i className="fas fa-calendar" />
                      {sessionLabel}
                    </span>
                  )}
                  {alert.participant?.session?.venueName && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">
                      <i className="fas fa-location-dot" />
                      {alert.participant.session.venueName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">
                    <i className="fas fa-user-check" />
                    {alert.examinerSummary?.submitted ?? 0} / {alert.examinerSummary?.total ?? 0} submitted
                  </span>
                  {alert.examinerSummary?.reopened > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-rose-600 dark:border-gray-700 dark:text-rose-400">
                      <i className="fas fa-rotate-left" />
                      {alert.examinerSummary.reopened} reopened
                    </span>
                  )}
                  {alert.examinerSummary?.pending > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-amber-600 dark:border-gray-700 dark:text-amber-400">
                      <i className="fas fa-hourglass-half" />
                      {alert.examinerSummary.pending} pending
                    </span>
                  )}
                </div>

                <div className="mt-4 text-right">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    View result
                    <i className="fas fa-arrow-right" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
