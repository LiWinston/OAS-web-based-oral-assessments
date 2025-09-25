"use client";

import { Button } from "@/components/ui/button";

const STATUS_PRESETS = [
  { label: "All", value: "all", icon: "fa-circle" },
  { label: "Released", value: "released", icon: "fa-paper-plane" },
  { label: "Not Released", value: "not_released", icon: "fa-lock" },
];

export default function ResultsFilterBar({ value, onChange }) {
  const current = value || {};

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search student / group or timeslot time</label>
        <input
          type="search"
          value={current.q || ""}
          onChange={(e) => onChange({ ...current, q: e.target.value })}
          placeholder="Search by name or timeslot time..."
          className="form-control w-full"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Release status</div>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {STATUS_PRESETS.map((preset) => {
              const active = (current.status || 'all') === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange({ ...current, status: preset.value })}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-2 transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <i className={`fas ${preset.icon}`} />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onChange({ q: '', status: 'all' })}
          className="self-start"
        >
          <i className="fas fa-rotate-left mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}
