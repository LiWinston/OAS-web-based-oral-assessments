"use client";

import Link from "next/link";

const REPORT_CARDS = [
  {
    title: "Scheduling Overview",
    description: "Heatmap, staffing gaps, booking pressure, and exportable session lists.",
    href: "/admin/reports/scheduling",
    icon: "fa-calendar-check",
    tone: "from-blue-500 to-indigo-600",
  },
  {
    title: "Mark Consolidation",
    description: "Aggregate examiner marks, resolve discrepancies, and prepare releases.",
    href: "/admin/reports/mark-consolidation",
    icon: "fa-chart-column",
    tone: "from-emerald-500 to-teal-600",
    disabled: false,
  },
  {
    title: "Examiner Trends",
    description: "Monitor examiner scoring patterns and workload health.",
    href: "/admin/reports/examiner-trends",
    icon: "fa-user-tie",
    tone: "from-purple-500 to-fuchsia-600",
    disabled: false,
  },
];

export default function AdminReportsHubPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-3 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <nav className="flex items-center gap-2" aria-label="Breadcrumb">
          <Link href="/admin" className="font-medium text-blue-600">OAS</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <Link href="/admin" className="hover:text-blue-600">Dashboard</Link>
          <i className="fas fa-chevron-right text-xs text-gray-400" />
          <span className="font-semibold text-blue-600">Reports</span>
        </nav>
      </div>

      <section className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-7 text-white shadow-lg">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-blue-100/80">Reports Hub</p>
          <h1 className="text-3xl font-semibold">Analytics built for Course Admin focus</h1>
          <p className="max-w-2xl text-sm text-blue-100/80">
            Browse interactive reports that highlight staffing risk, marking readiness, and examiner trends. Each module surfaces
            alerts first, so you can intervene quickly and share a clear snapshot with stakeholders.
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => (
          <ReportCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ title, description, href, icon, tone, disabled }) {
  const content = (
    <div className={`rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 ${disabled ? 'opacity-60' : ''}`}>
      <div className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r ${tone} px-4 py-2 text-sm font-semibold text-white shadow-md`}>
        <i className={`fas ${icon} mr-2`} />
        {title}
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
        {disabled ? 'Coming soon' : 'Open report'}
        {!disabled && <i className="fas fa-arrow-right" />}
      </span>
    </div>
  );

  if (disabled) {
    return <div>{content}</div>;
  }

  return (
    <Link href={href} className="no-underline">
      {content}
    </Link>
  );
}
