"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";

const STATUS_PRESETS = [
  { label: "All", value: "all", icon: "fa-circle" },
  { label: "Released", value: "released", icon: "fa-paper-plane" },
  { label: "Not Released", value: "not_released", icon: "fa-lock" },
];

export default function ResultsFilterBar({ value, onChange, sessions = [] }) {
  const current = value || {};

  const sessionOptions = useMemo(() => {
    const unique = new Map();
    sessions.forEach((session) => {
      if (!session?.id) return;
      unique.set(session.id, session);
    });
    return Array.from(unique.values());
  }, [sessions]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search student or group</label>
        <input
          type="search"
          value={current.q || ""}
          onChange={(e) => onChange({ ...current, q: e.target.value })}
          placeholder="Type a name or submission ID..."
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

        <div className="min-w-[12rem]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Session</label>
          <select
            value={current.sessionId || ""}
            onChange={(e) => onChange({ ...current, sessionId: e.target.value || undefined })}
            className="form-control w-full"
          >
            <option value="">All sessions</option>
            {sessionOptions.map((session) => {
              const start = session.start ? new Date(session.start) : null;
              const label = start
                ? `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : `Session ${session.id}`;
              return (
                <option key={session.id} value={session.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <Button
          variant="outline"
          onClick={() => onChange({ q: '', status: 'all', sessionId: undefined })}
          className="self-start"
        >
          <i className="fas fa-rotate-left mr-2" /> Reset
        </Button>
      </div>
    </div>
  );
}
