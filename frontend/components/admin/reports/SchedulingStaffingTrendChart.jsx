"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Brush,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_CONFIG = {
  fully: { label: "Fully staffed", color: "#34d399", active: "#059669" },
  partial: { label: "Partially staffed", color: "#fbbf24", active: "#d97706" },
  none: { label: "Unstaffed", color: "#fb7185", active: "#e11d48" },
};
const STATUS_KEYS = Object.keys(STATUS_CONFIG);

const formatLabel = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  } catch (error) {
    return value;
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const source = payload[0]?.payload;
  const total = source?.rawTotal || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
        {formatLabel(label)}
      </div>
      <div className="space-y-1">
        {payload.map((entry) => {
          const config = STATUS_CONFIG[entry.dataKey] || {};
          const rawKey = `raw${entry.dataKey.charAt(0).toUpperCase()}${entry.dataKey.slice(1)}`;
          const rawValue = source?.[rawKey] ?? 0;
          const percent = total > 0 ? Math.round((rawValue / total) * 100) : 0;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-6">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || config.color }} />
                {config.label || entry.name}
              </span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-200">
                {rawValue} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SchedulingStaffingTrendChart({ data, activeDate, onSelectDate, isLoading }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const [visibleKeys, setVisibleKeys] = useState(() => [...STATUS_KEYS]);

  const chartData = useMemo(() => {
    if (!hasData) return [];
    return data.map((item) => {
      const fully = item.fully || 0;
      const partial = item.partial || item.partially || 0;
      const none = item.none || item.unstaffed || item.noStaffed || 0;
      const total = fully + partial + none;
      return {
        date: item.date,
        fully,
        partial,
        none,
        rawFully: fully,
        rawPartial: partial,
        rawNone: none,
        rawTotal: total,
      };
    });
  }, [data, hasData]);

  const toggleKey = useCallback((key) => {
    if (!key) return;
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((item) => item !== key);
        return next.length === 0 ? prev : next;
      }
      return [...prev, key];
    });
  }, []);

  const renderLegend = useCallback(() => {
    return (
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {STATUS_KEYS.map((key) => {
          const config = STATUS_CONFIG[key] || {};
          const isActive = visibleKeys.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleKey(key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                isActive
                  ? "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          );
        })}
      </div>
    );
  }, [toggleKey, visibleKeys]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Staffing Trend</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily coverage snapshot</h3>
        </div>
        {isLoading && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-500" />
            Loading
          </span>
        )}
      </div>

      {!hasData && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
          No scheduling data available yet.
        </div>
      )}

      {hasData && (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              stackOffset="expand"
              onClick={(chartEvent) => {
                const payload = chartEvent?.activePayload?.[0]?.payload;
                if (payload?.date && onSelectDate) {
                  onSelectDate(payload.date);
                }
              }}
            >
              <defs>
                {STATUS_KEYS.map((key) => {
                  const config = STATUS_CONFIG[key];
                  return (
                  <linearGradient key={key} id={`staffing-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.6} />
                  </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "80%", position: "left", fill: "#3b82f6", fontSize: 11 }} />
              <Legend content={renderLegend} />
              {STATUS_KEYS.map((key) => {
                const config = STATUS_CONFIG[key];
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="staffing"
                    fill={`url(#staffing-${key})`}
                    radius={[6, 6, 0, 0]}
                    hide={!visibleKeys.includes(key)}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`${key}-${entry.date}`}
                        fill={entry.date === activeDate ? config.active : config.color}
                      />
                    ))}
                  </Bar>
                );
              })}
              <Brush height={22} travellerWidth={12} stroke="#6366f1" dataKey="date" tickFormatter={formatLabel} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
