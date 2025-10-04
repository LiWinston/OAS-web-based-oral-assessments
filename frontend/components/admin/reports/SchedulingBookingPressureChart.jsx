"use client";

import { useMemo, useState, useCallback } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  Area,
  Brush,
  Cell,
} from "recharts";

const formatRatio = (value) => `${Math.round(value * 100)}%`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const record = payload[0]?.payload || {};
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
        {label}
      </div>
      <div className="space-y-1 text-slate-600 dark:text-slate-200">
        <div className="flex items-center justify-between">
          <span>Booked</span>
          <span className="font-mono">{record.booked}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Capacity</span>
          <span className="font-mono">{record.capacity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Fill rate</span>
          <span className="font-mono">{formatRatio(record.ratio || 0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sessions</span>
          <span className="font-mono">{record.sessions || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default function SchedulingBookingPressureChart({ data, isLoading }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const [highlight, setHighlight] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({
    capacity: true,
    booked: true,
    ratio: true,
  });

  const seriesConfig = useMemo(() => ({
    capacity: { label: "Capacity", color: "#bfdbfe" },
    booked: { label: "Booked", color: "#3b82f6" },
    ratio: { label: "Fill rate", color: "#ef4444" },
  }), []);

  const chartData = useMemo(() => {
    if (!hasData) return [];
    return data.map((item) => ({
      ...item,
      ratioTrend: item.ratio,
    }));
  }, [data, hasData]);

  const handleBarClick = useCallback((entry) => {
    const venue = entry?.activePayload?.[0]?.payload?.venue;
    setHighlight((prev) => (prev === venue ? null : venue));
  }, []);

  const toggleSeries = useCallback((key) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const renderLegend = useCallback(() => (
    <div className="mt-2 flex flex-wrap gap-3 text-xs">
      {Object.entries(seriesConfig).map(([key, config]) => {
        const active = visibleSeries[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleSeries(key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
              active
                ? "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
            {config.label}
          </button>
        );
      })}
    </div>
  ), [seriesConfig, toggleSeries, visibleSeries]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500">Booking Pressure</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Venue capacity vs demand</h3>
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
          No venue data matches the current filters.
        </div>
      )}

      {hasData && (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="venue" tick={{ fill: "#6b7280", fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis
                yAxisId="counts"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                label={{ value: "Bookings", angle: -90, position: "insideLeft", dy: 10, fill: "#6b7280", fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="ratio"
                orientation="right"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={formatRatio}
                label={{ value: "Fill rate", angle: 90, position: "insideRight", dy: -10, fill: "#6b7280", fontSize: 12 }}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
              {visibleSeries.capacity && (
                <Bar yAxisId="counts" dataKey="capacity" barSize={24} fill={seriesConfig.capacity.color} />
              )}
              {visibleSeries.booked && (
                <Bar yAxisId="counts" dataKey="booked" barSize={24} fill={seriesConfig.booked.color}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.venue}
                      fill={highlight === entry.venue ? "#1d4ed8" : seriesConfig.booked.color}
                    />
                  ))}
                </Bar>
              )}
              {visibleSeries.ratio && (
                <>
                  <Area
                    yAxisId="ratio"
                    type="monotone"
                    dataKey="ratioTrend"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="#6366f1"
                    fillOpacity={0.15}
                    isAnimationActive
                  />
                  <Line yAxisId="ratio" type="monotone" dataKey="ratio" stroke={seriesConfig.ratio.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <ReferenceLine yAxisId="ratio" y={0.85} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "85% target", position: "insideTopRight", fill: "#22c55e", fontSize: 11 }} />
                </>
              )}
              <Brush height={22} travellerWidth={12} stroke="#6366f1" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
