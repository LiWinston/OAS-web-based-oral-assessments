"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminResultSessionPage() {
  const params = useParams();
  const { courseId, assignmentId, sessionId } = params;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-3">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300" aria-label="Breadcrumb">
          <Link href="/admin" className="font-semibold text-blue-600">
            OAS
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin/results" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Results Hub
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link
            href={`/admin/courses/${courseId}/assignments`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Assignment Sessions
          </Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Session {sessionId}</span>
        </nav>
      </div>

      <section className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/30 px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">
          <i className="fas fa-clock" />
        </div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Session detail coming soon</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          We are currently rebuilding the session participant experience. This page will soon display participant readiness,
          examiner progress, and quick actions for releasing results.
        </p>
      </section>
    </div>
  );
}
