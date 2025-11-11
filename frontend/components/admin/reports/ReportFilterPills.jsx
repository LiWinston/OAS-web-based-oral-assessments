"use client";

import clsx from "clsx";

const TONE_MAP = {
  blue: "bg-blue-600 text-white shadow-sm hover:bg-blue-500",
  emerald: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500",
  indigo: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
  amber: "bg-amber-500 text-white shadow-sm hover:bg-amber-400",
};

const SIZE_CLASS = {
  xs: "px-2.5 py-1 text-[11px]",
  sm: "px-3 py-1.5 text-xs",
};

export default function ReportFilterPills({
  options,
  value,
  onChange,
  tone = "blue",
  size = "sm",
  className = "",
}) {
  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange?.(option.id)}
            className={clsx(
              "rounded-full font-medium transition-colors",
              SIZE_CLASS[size] ?? SIZE_CLASS.sm,
              isActive
                ? TONE_MAP[tone] ?? TONE_MAP.blue
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
