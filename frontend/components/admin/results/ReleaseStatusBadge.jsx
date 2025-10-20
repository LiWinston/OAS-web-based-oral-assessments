"use client";

const STATUS_META = {
  RELEASED: {
    icon: "fa-paper-plane",
    label: "Released",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50",
  },
  NOT_RELEASED: {
    icon: "fa-clock",
    label: "Not released",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
  },
};

export function ReleaseStatusBadge({ status }) {
  const normalized = (status || "NOT_RELEASED").toString().trim().toUpperCase();
  const meta = STATUS_META[normalized] ?? STATUS_META.NOT_RELEASED;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <i className={`fas ${meta.icon} text-[10px]`} />
      {meta.label}
    </span>
  );
}

export default ReleaseStatusBadge;
