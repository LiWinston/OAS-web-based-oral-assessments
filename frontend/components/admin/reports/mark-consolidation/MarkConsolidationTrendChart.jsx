"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#8b5cf6",
  "#f43f5e",
  "#14b8a6",
];

const formatBucketLabel = (bucket, interval) => {
  if (!bucket) return "";
  if (interval === "week") {
    return bucket;
  }
  try {
    const date = new Date(bucket);
    if (Number.isNaN(date.getTime())) return bucket;
    return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  } catch (error) {
    return bucket;
  }
};

const mergeSeries = (series = []) => {
  const buckets = new Map();

  series.forEach((entry) => {
    entry.points?.forEach((point) => {
      if (!buckets.has(point.bucket)) {
        buckets.set(point.bucket, { bucket: point.bucket });
      }
      const record = buckets.get(point.bucket);
      record[entry.key] = point.count ?? 0;
    });
  });

  return Array.from(buckets.values()).sort((a, b) => {
    if (a.bucket < b.bucket) return -1;
    if (a.bucket > b.bucket) return 1;
    return 0;
  });
};

const totalForPoint = (point, keys) =>
  keys.reduce((acc, key) => acc + (Number.isFinite(point[key]) ? point[key] : 0), 0);

const CustomTooltip = ({ active, payload, label, interval, keys }) => {
  if (!active || !payload?.length) return null;

  const heading = formatBucketLabel(label, interval);
  const total = totalForPoint(payload[0]?.payload ?? {}, keys);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
        {heading}
      </div>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-10">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-200">{item.value ?? 0}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-400 dark:border-slate-600 dark:text-slate-400">
        Total: {total}
      </div>
    </div>
  );
};

export default function MarkConsolidationTrendChart({ trends, isLoading }) {
  const interval = trends?.interval ?? "day";
  const series = useMemo(() => trends?.series ?? [], [trends]);

  const merged = useMemo(() => mergeSeries(series), [series]);
  const dataKeys = useMemo(() => series.map((entry) => entry.key), [series]);

  const colorMap = useMemo(() => {
    const map = {};
    series.forEach((entry, index) => {
      map[entry.key] = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    });
    return map;
  }, [series]);

  const hasData = merged.length > 0;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Progress Trend</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Examiner activity over time</h3>
        </div>
        {isLoading && (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-500" />
            Loading
          </span>
        )}
      </div>

      {!hasData && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
          {isLoading ? "Loading trend data…" : "No recent examiner activity recorded."}
        </div>
      )}

      {hasData && (
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="bucket"
                tickFormatter={(value) => formatBucketLabel(value, interval)}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip interval={interval} keys={dataKeys} />} />
              <Legend />
              {series.map((entry, index) => (
                <Line
                  key={entry.key}
                  type="monotone"
                  dataKey={entry.key}
                  name={entry.name ?? entry.key}
                  stroke={colorMap[entry.key]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
